import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { analyzeTaxDocument } from '@/lib/llm';
import { db } from '@/lib/db';
import { convertToBase64, convertPdfToImage } from '@/lib/fileHelpers';
import './TaxDocumentUploader.css';

interface TaxDocumentUploaderProps {
    onUploadComplete?: () => void;
}

export const TaxDocumentUploader = ({ onUploadComplete }: TaxDocumentUploaderProps) => {
    const { settings } = useApp();
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        if (!settings.apiKey) {
            setError("Please configure OpenRouter API Key in Settings.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setStatus('Processing document...');

        const file = acceptedFiles[0];

        try {
            let base64 = '';
            if (file.type === 'application/pdf') {
                setStatus('Converting PDF...');
                base64 = await convertPdfToImage(file);
            } else {
                base64 = await convertToBase64(file);
            }

            const cleanBase64 = base64.split(',')[1];
            setStatus('Analyzing tax data with AI...');

            const result = await analyzeTaxDocument(cleanBase64, settings.apiKey, settings.model);

            // Save to DB
            const docId = await db.tax_documents.add({
                fileName: file.name,
                docType: result.docType || 'other',
                taxYear: result.taxYear || '2024', // Default if missed
                imageData: base64,
                uploadedAt: Date.now()
            });

            await db.tax_insights.add({
                docId: Number(docId),
                type: 'extraction',
                data: result,
                createdAt: Date.now()
            });

            setStatus('Done!');
            setIsProcessing(false);
            if (onUploadComplete) onUploadComplete();

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Tax analysis failed.");
            setIsProcessing(false);
        }
    }, [settings.apiKey, settings.model, onUploadComplete]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
        },
        multiple: false
    });

    return (
        <div className="tax-uploader">
            {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {!isProcessing ? (
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-slate-700 hover:border-slate-500 bg-slate-800/30'
                        }`}
                >
                    <input {...getInputProps()} />
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="p-3 bg-slate-800 rounded-full">
                            <UploadCloud size={24} className="text-blue-500" />
                        </div>
                        <div>
                            <p className="font-medium text-slate-200">
                                {isDragActive ? "Drop file here" : "Upload Tax Document"}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG (W2, 1099, etc)</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center gap-4 bg-slate-800/30">
                    {status === 'Done!' ? (
                        <CheckCircle className="text-green-500" size={32} />
                    ) : (
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    )}
                    <div className="text-center">
                        <p className="font-medium text-slate-200">{status}</p>
                        <p className="text-xs text-slate-500 mt-1">AI Analyst is working...</p>
                    </div>
                </div>
            )}
        </div>
    );
};

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useLiveQuery } from 'dexie-react-hooks';
import { PageHeader } from '@/components/ui/PageHeader';
import { UploadCloud, Loader2, AlertCircle, FileText, X, ZoomIn, ZoomOut, RotateCw, Trash2 } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';
import { analyzeDocument } from '@/lib/llm';
import { db } from '@/lib/db';
import type { UploadedDocument } from '@/lib/db';
import { format } from 'date-fns';
import { convertToBase64, convertPdfToImage } from '@/lib/fileHelpers';
import './UploadHub.css';

import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export const UploadHub = () => {
    const navigate = useNavigate();
    const { settings } = useApp();
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        docId: string | null;
    }>({ isOpen: false, docId: null });

    const documents = useLiveQuery(
        () => db.documents.orderBy('uploadedAt').reverse().toArray()
    );

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length === 0) return;

        if (!settings.apiKey) {
            setError("Please configure your OpenRouter API Key in Settings first.");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setStatus('Preparing files...');

        const file = acceptedFiles[0];

        try {
            let base64 = '';

            if (file.type === 'application/pdf') {
                setStatus('Converting PDF pages...(Quality: High)');
                base64 = await convertPdfToImage(file);
            } else {
                setStatus('Encoding image...');
                base64 = await convertToBase64(file);
            }

            const cleanBase64 = base64.split(',')[1];

            setStatus('Analyzing with AI (this may take 20s)...');
            const result = await analyzeDocument(cleanBase64, settings.apiKey, settings.model);


            // Save draft for persistence
            await db.drafts.add({
                fileId: file.name,
                image: base64,
                result: result,
                createdAt: Date.now()
            });

            navigate('/verify', { state: { result, fileId: file.name, image: base64 } });

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to process document.");
            setIsProcessing(false);
        }
    }, [settings.apiKey, navigate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png'],
            'application/pdf': ['.pdf']
        },
        multiple: false
    });

    const adjustZoom = (delta: number) => {
        setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    const handleDelete = (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        setConfirmState({ isOpen: true, docId });
    };

    const executeDelete = async () => {
        if (!confirmState.docId) return;

        try {
            // Cascade delete: remove signals first, then the document
            await db.signals.where('sourceDocId').equals(confirmState.docId).delete();
            await db.documents.delete(confirmState.docId);
            setConfirmState({ isOpen: false, docId: null });
        } catch (err) {
            console.error("Failed to delete document:", err);
            alert("Failed to delete document");
        }
    };

    return (
        <div className="upload-page">
            <PageHeader
                title="Upload Hub"
                subtitle="Securely process financial documents locally. No data is stored on our servers."
            />

            {error && (
                <div className="upload-error">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {!isProcessing ? (
                <div
                    {...getRootProps()}
                    className={`drop-zone ${isDragActive ? 'active' : ''}`}
                >
                    <input {...getInputProps()} />
                    <div className="drop-zone-icon">
                        <UploadCloud />
                    </div>
                    <div className="drop-zone-text">
                        <p className="drop-zone-title">
                            {isDragActive ? "Drop it like it's hot" : "Drag & Drop your statement"}
                        </p>
                        <p className="drop-zone-subtitle">Supports PDF, JPG, PNG (Max 10MB)</p>
                    </div>
                </div>
            ) : (
                <div className="processing-state">
                    <Loader2 className="processing-spinner" />
                    <div className="processing-text">
                        <p className="processing-title">{status}</p>
                        <p className="processing-subtitle">This happens securely via OpenRouter</p>
                    </div>
                </div>
            )}

            {/* Document History Section */}
            {documents && documents.length > 0 && (
                <div className="document-history">
                    <h3 className="history-title">
                        <FileText size={18} />
                        Previous Uploads
                    </h3>
                    <div className="document-grid">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="document-card"
                                onClick={() => {
                                    setPreviewDoc(doc);
                                    setZoomLevel(1);
                                }}
                            >
                                <div className="document-thumbnail">
                                    <img src={doc.imageData} alt={doc.fileName} />
                                </div>
                                <div className="document-info">
                                    <p className="document-name">{doc.fileName}</p>
                                    <p className="document-meta">
                                        {format(doc.uploadedAt, 'MMM d, yyyy')} • {doc.signalCount} signals
                                    </p>
                                </div>
                                <button
                                    className="delete-doc-btn"
                                    onClick={(e) => handleDelete(e, doc.id!)}
                                    title="Delete document"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {previewDoc && (
                <div className="preview-overlay" onClick={() => setPreviewDoc(null)}>
                    <div className="preview-modal" onClick={e => e.stopPropagation()}>
                        <div className="preview-header">
                            <span className="preview-title">{previewDoc.fileName}</span>
                            <div className="preview-controls">
                                <button className="control-btn" onClick={() => adjustZoom(-0.25)} title="Zoom Out">
                                    <ZoomOut size={18} />
                                </button>
                                <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
                                <button className="control-btn" onClick={() => adjustZoom(0.25)} title="Zoom In">
                                    <ZoomIn size={18} />
                                </button>
                                <button className="control-btn" onClick={() => setZoomLevel(1)} title="Reset">
                                    <RotateCw size={18} />
                                </button>
                            </div>
                            <button className="preview-close" onClick={() => setPreviewDoc(null)}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="preview-content">
                            <img
                                src={previewDoc.imageData}
                                alt={previewDoc.fileName}
                                style={{
                                    width: `${zoomLevel * 100}%`,
                                    maxWidth: 'none' // override css limitation
                                }}
                            />
                        </div>

                        <div className="preview-footer">
                            <p className="preview-meta">
                                Uploaded {format(previewDoc.uploadedAt, 'MMMM d, yyyy')} • {previewDoc.signalCount} signals extracted
                            </p>
                        </div>
                    </div>
                </div>
            )}
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmState.isOpen}
                title="Delete Document?"
                message="Are you sure you want to delete this document? All associated signals and transaction data will be permanently removed. This action cannot be undone."
                confirmLabel="Delete Document"
                isDestructive={true}
                onConfirm={executeDelete}
                onCancel={() => setConfirmState({ isOpen: false, docId: null })}
            />
        </div>
    );
};




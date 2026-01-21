import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { db, type FinancialSignal } from '@/lib/db';
import { Check, X, Calendar, DollarSign, Tag, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import './SignalVerification.css';

export const SignalVerification = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const [signals, setSignals] = useState<FinancialSignal[]>([]);
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [fileId, setFileId] = useState<string>('');
    const [draftId, setDraftId] = useState<number | undefined>(undefined);

    const adjustZoom = (delta: number) => {
        setZoomLevel(prev => Math.max(0.5, Math.min(3, prev + delta)));
    };

    useEffect(() => {
        const loadData = async () => {
            let resultToProcess = state?.result;
            let imageToProcess = state?.image;
            let fileIdToProcess = state?.fileId;
            let currentDraftId = undefined;

            // If no state, try to load from drafts
            if (!state) {
                const lastDraft = await db.drafts.orderBy('createdAt').last();
                if (lastDraft) {
                    resultToProcess = lastDraft.result;
                    imageToProcess = lastDraft.image;
                    fileIdToProcess = lastDraft.fileId;
                    currentDraftId = lastDraft.id;
                }
            }

            if (resultToProcess?.signals) {
                const mapped = resultToProcess.signals.map((s: any) => ({
                    ...s,
                    id: crypto.randomUUID(),
                    sourceDocId: fileIdToProcess,
                    createdAt: Date.now(),
                    flow: s.flow?.toLowerCase() === 'inflow' ? 'inflow' : 'outflow',
                    nature: s.nature || 'variable_estimate',
                    amount: Number(s.amount) || 0
                })).sort((a: any, b: any) => {
                    const dateA = new Date(a.date).getTime();
                    const dateB = new Date(b.date).getTime();
                    if (isNaN(dateA)) return 1;
                    if (isNaN(dateB)) return -1;
                    return dateB - dateA;
                });

                setSignals(mapped);
            }
            if (imageToProcess) {
                setImageSrc(imageToProcess);
            }
            if (fileIdToProcess) {
                setFileId(fileIdToProcess);
            }
            if (currentDraftId) {
                setDraftId(currentDraftId);
            }
        };

        loadData();
    }, [state]);

    const handleSaveAll = async () => {
        try {
            // Generate a document ID and save the document first
            const docId = crypto.randomUUID();

            if (imageSrc) {
                await db.documents.add({
                    id: docId,
                    fileName: fileId || 'Unknown',
                    imageData: imageSrc,
                    uploadedAt: Date.now(),
                    signalCount: signals.length
                });
            }

            // Update signals with the document ID and save them
            if (signals.length > 0) {
                const signalsWithDocId = signals.map(s => ({
                    ...s,
                    sourceDocId: docId
                }));
                await db.signals.bulkAdd(signalsWithDocId);
            }

            // Clear draft if exists
            if (draftId) {
                await db.drafts.delete(draftId);
            }
            // Also clean up any other drafts to keep it tidy
            await db.drafts.clear();

            navigate('/signals');
        } catch (e) {
            console.error('Failed to save signals', e);
            alert('Error saving signals. See console.');
        }
    };

    const removeSignal = (id: string) => {
        setSignals(prev => prev.filter(s => s.id !== id));
    };

    const updateSignal = (id: string, updates: Partial<FinancialSignal>) => {
        setSignals(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    };

    const handleCancel = async () => {
        if (draftId) {
            await db.drafts.delete(draftId);
        }
        await db.drafts.clear(); // Safety clear
        navigate('/upload');
    };

    if (!state && !imageSrc) {
        return (
            <div className="no-data-message">
                No data to verify. Please upload a document first.
            </div>
        );
    }

    return (
        <div className="verify-page">
            <div className="verify-header">
                <PageHeader
                    title="Verification"
                    subtitle="Confirm extracted data against the document."
                />
                <div className="verify-actions">
                    <button onClick={handleCancel} className="cancel-btn">
                        Cancel
                    </button>
                    <button onClick={handleSaveAll} className="confirm-btn">
                        <Check size={18} />
                        Confirm {signals.length} Signals
                    </button>
                </div>
            </div>

            <div className="verify-content">
                {/* Left: Image Preview */}
                {/* Left: Image Preview */}
                <div className="image-preview-container">
                    <div className="image-controls">
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

                    <div className="image-scroll-area">
                        {imageSrc ? (
                            <img
                                src={imageSrc}
                                alt="Document Source"
                                style={{
                                    width: `${zoomLevel * 100}%`,
                                    maxWidth: 'none'
                                }}
                            />
                        ) : (
                            <div className="image-preview-empty">No Image</div>
                        )}
                    </div>
                    <div className="image-preview-label">{fileId}</div>
                </div>

                {/* Right: Extracted Signals List */}
                <div className="signals-list">
                    {signals.map((signal) => (
                        <SignalCard
                            key={signal.id}
                            signal={signal}
                            onUpdate={(u) => updateSignal(signal.id!, u)}
                            onRemove={() => removeSignal(signal.id!)}
                        />
                    ))}
                    {signals.length === 0 && (
                        <div className="empty-signals">
                            No financial signals extracted.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SignalCard = ({ signal, onUpdate, onRemove }: {
    signal: FinancialSignal;
    onUpdate: (u: Partial<FinancialSignal>) => void;
    onRemove: () => void;
}) => {
    return (
        <div className="signal-card">
            <button onClick={onRemove} className="remove-signal-btn">
                <X size={16} />
            </button>

            <div className="signal-card-header">
                <input
                    value={signal.merchant}
                    onChange={(e) => onUpdate({ merchant: e.target.value })}
                    className="signal-merchant-input"
                    placeholder="Merchant Name"
                />

                <div className="signal-amount-wrapper">
                    <DollarSign size={14} className={`signal-amount-icon ${signal.flow}`} />
                    <input
                        type="number"
                        value={signal.amount}
                        onChange={(e) => onUpdate({ amount: Number(e.target.value) })}
                        className={`signal-amount-input ${signal.flow}`}
                    />
                </div>
            </div>

            <div className="signal-card-fields">
                <div className="signal-field">
                    <Calendar size={14} />
                    <input
                        type="date"
                        value={signal.date.split('T')[0]}
                        onChange={(e) => onUpdate({ date: e.target.value })}
                    />
                </div>

                <div className="signal-field">
                    <Tag size={14} />
                    <input
                        value={signal.category}
                        onChange={(e) => onUpdate({ category: e.target.value })}
                        placeholder="Category"
                    />
                </div>

                <div className="signal-selectors">
                    <select
                        value={signal.nature}
                        onChange={(e) => onUpdate({ nature: e.target.value as any })}
                        className="signal-select"
                    >
                        <option value="variable_estimate">Variable (One-off)</option>
                        <option value="fixed_recurring">Fixed Recurring (Subscription)</option>
                        <option value="income_source">Income</option>
                    </select>

                    <select
                        value={signal.flow}
                        onChange={(e) => onUpdate({ flow: e.target.value as any })}
                        className={`signal-select flow-select ${signal.flow}`}
                    >
                        <option value="outflow">Outflow</option>
                        <option value="inflow">Inflow</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

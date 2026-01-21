import { useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmationModal = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel
}: ConfirmationModalProps) => {

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onCancel();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="modal-content confirmation-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title-wrapper">
                        {isDestructive && <AlertTriangle className="modal-icon-destructive" size={20} />}
                        <h2 className="modal-title">{title}</h2>
                    </div>
                    <button className="modal-close-btn" onClick={onCancel}>
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    <p className="modal-message">{message}</p>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn-cancel" onClick={onCancel}>
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        className={`btn-confirm ${isDestructive ? 'btn-destructive' : 'btn-primary'}`}
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

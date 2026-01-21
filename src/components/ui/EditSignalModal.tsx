import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { FinancialSignal, FlowDirection, EntityNature, RecurringFrequency } from '@/lib/db';
import './EditSignalModal.css';

interface EditSignalModalProps {
    signal: FinancialSignal;
    onSave: (updatedSignal: FinancialSignal) => void;
    onClose: () => void;
}

const NATURE_OPTIONS: { value: EntityNature; label: string }[] = [
    { value: 'fixed_recurring', label: 'Fixed (Recurring)' },
    { value: 'variable_estimate', label: 'Variable (Estimate)' },
    { value: 'income_source', label: 'Income Source' }
];

const FREQUENCY_OPTIONS: { value: RecurringFrequency; label: string }[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semi-annual', label: 'Semi-annual' },
    { value: 'annual', label: 'Annual' }
];

export const EditSignalModal = ({ signal, onSave, onClose }: EditSignalModalProps) => {
    const [formData, setFormData] = useState({
        date: signal.date,
        merchant: signal.merchant,
        amount: signal.amount,
        flow: signal.flow as FlowDirection,
        nature: signal.nature as EntityNature,
        category: signal.category,
        frequency: signal.frequency || 'monthly' as RecurringFrequency
    });

    // Close on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            ...signal,
            ...formData,
            amount: Number(formData.amount)
        });
    };

    const updateField = <K extends keyof typeof formData>(
        field: K,
        value: typeof formData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2 className="modal-title">Edit Signal</h2>
                    <button className="modal-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.date}
                                onChange={e => updateField('date', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Merchant/Source</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.merchant}
                                onChange={e => updateField('merchant', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount</label>
                        <input
                            type="number"
                            className="form-input"
                            step="0.01"
                            value={formData.amount}
                            onChange={e => updateField('amount', parseFloat(e.target.value) || 0)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Flow</label>
                        <div className="flow-toggle">
                            <button
                                type="button"
                                className={`flow-btn ${formData.flow === 'outflow' ? 'active' : ''}`}
                                onClick={() => updateField('flow', 'outflow')}
                            >
                                Outflow
                            </button>
                            <button
                                type="button"
                                className={`flow-btn ${formData.flow === 'inflow' ? 'active' : ''}`}
                                onClick={() => updateField('flow', 'inflow')}
                            >
                                Inflow
                            </button>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Nature</label>
                            <select
                                className="form-select"
                                value={formData.nature}
                                onChange={e => updateField('nature', e.target.value as EntityNature)}
                            >
                                {NATURE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Frequency</label>
                            <select
                                className="form-select"
                                value={formData.frequency}
                                onChange={e => updateField('frequency', e.target.value as RecurringFrequency)}
                            >
                                {FREQUENCY_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <input
                            type="text"
                            className="form-input"
                            value={formData.category}
                            onChange={e => updateField('category', e.target.value)}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

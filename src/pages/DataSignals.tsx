import { PageHeader } from '@/components/ui/PageHeader';
import { EditSignalModal } from '@/components/ui/EditSignalModal';
import { db } from '@/lib/db';
import type { FinancialSignal } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownLeft, Trash2, Search, Pencil, XCircle } from 'lucide-react';
import { useState } from 'react';
import './DataSignals.css';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

export const DataSignals = () => {
    // Fetch all signals and sort in memory to ensure robust date handling
    const allSignals = useLiveQuery(async () => {
        const signals = await db.signals.toArray();
        return signals.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();

            // Handle invalid dates: push them to the end
            if (isNaN(dateA)) return 1;
            if (isNaN(dateB)) return -1;

            return dateB - dateA;
        });
    });

    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'all' | 'recurring'>('all');
    const [editingSignal, setEditingSignal] = useState<FinancialSignal | null>(null);

    // Confirmation States
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isClearAllOpen, setIsClearAllOpen] = useState(false);

    const filteredSignals = allSignals?.filter(s =>
        (s.merchant.toLowerCase().includes(search.toLowerCase()) ||
            s.category.toLowerCase().includes(search.toLowerCase())) &&
        (viewMode === 'recurring' ? !!s.frequency : true)
    );

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const executeDelete = async () => {
        if (deleteId) {
            await db.signals.delete(deleteId);
            setDeleteId(null);
        }
    };

    const handleSave = async (updatedSignal: FinancialSignal) => {
        if (updatedSignal.id) {
            await db.signals.put(updatedSignal);
        }
        setEditingSignal(null);
    };

    const handleClearAll = () => {
        const count = allSignals?.length || 0;
        if (count > 0) {
            setIsClearAllOpen(true);
        }
    };

    const executeClearAll = async () => {
        await db.signals.clear();
        setIsClearAllOpen(false);
    };

    const formatFrequency = (freq?: string) => {
        if (!freq) return '-';
        return freq.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
    };

    const calculateMonthlyAmount = (amount: number, frequency?: string) => {
        if (!frequency) return amount;

        switch (frequency) {
            case 'daily': return (amount * 365) / 12;
            case 'weekly': return (amount * 52) / 12;
            case 'bi-weekly': return (amount * 26) / 12;
            case 'monthly': return amount;
            case 'quarterly': return (amount * 4) / 12;
            case 'semi-annual': return (amount * 2) / 12;
            case 'annual': return amount / 12;
            default: return amount;
        }
    };

    return (
        <div className="signals-page">
            <PageHeader
                title="Signals"
                subtitle={`All extracted transactions (${allSignals?.length || 0}).`}
            >
                <div className="header-actions">
                    <div className="search-input-wrapper">
                        <Search className="search-input-icon" size={16} />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search..."
                            className="search-input"
                        />
                    </div>
                    {(allSignals?.length || 0) > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="clear-all-btn"
                        >
                            <XCircle size={16} />
                            Clear All
                        </button>
                    )}
                </div>
            </PageHeader>

            <div className="view-tabs">
                <button
                    className={`view-tab ${viewMode === 'all' ? 'active' : ''}`}
                    onClick={() => setViewMode('all')}
                >
                    All Signals
                </button>
                <button
                    className={`view-tab ${viewMode === 'recurring' ? 'active' : ''}`}
                    onClick={() => setViewMode('recurring')}
                >
                    Recurring Signals
                </button>
            </div>

            <div className="data-table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Merchant</th>
                            {viewMode === 'recurring' ? (
                                <>
                                    <th>Monthly Amount</th>
                                    <th>Original Amount / Freq</th>
                                </>
                            ) : (
                                <>
                                    <th>Amount</th>
                                    <th>Frequency</th>
                                </>
                            )}
                            <th>Category</th>
                            <th>Nature</th>
                            <th className="cell-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSignals?.map((signal) => (
                            <tr key={signal.id}>
                                <td className="cell-date">
                                    {format(new Date(signal.date), 'MMM d, yyyy')}
                                </td>
                                <td className="cell-merchant">{signal.merchant}</td>

                                {viewMode === 'recurring' ? (
                                    <>
                                        <td>
                                            <div className={`cell-amount ${signal.flow}`}>
                                                {signal.flow === 'outflow' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                ${calculateMonthlyAmount(signal.amount, signal.frequency).toFixed(2)}
                                                <span className="monthly-label">/mo</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="original-amount-cell">
                                                <span className="original-amount">${signal.amount.toFixed(2)}</span>
                                                <span className="original-freq">{formatFrequency(signal.frequency)}</span>
                                            </div>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>
                                            <div className={`cell-amount ${signal.flow}`}>
                                                {signal.flow === 'outflow' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
                                                ${signal.amount.toFixed(2)}
                                            </div>
                                        </td>
                                        <td className="cell-frequency">{formatFrequency(signal.frequency)}</td>
                                    </>
                                )}

                                <td>
                                    <span className="category-badge">{signal.category}</span>
                                </td>
                                <td className="cell-nature">{signal.nature.replace('_', ' ')}</td>
                                <td className="cell-actions">
                                    <button
                                        onClick={() => setEditingSignal(signal)}
                                        className="edit-btn"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(signal.id!)}
                                        className="delete-btn"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredSignals?.length === 0 && (
                            <tr>
                                <td colSpan={viewMode === 'recurring' ? 7 : 7} className="empty-state">
                                    {viewMode === 'recurring' ? 'No recurring signals found.' : 'No signals found.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingSignal && (
                <EditSignalModal
                    signal={editingSignal}
                    onSave={handleSave}
                    onClose={() => setEditingSignal(null)}
                />
            )}

            {/* Delete Single Signal Modal */}
            <ConfirmationModal
                isOpen={!!deleteId}
                title="Delete Signal?"
                message="Are you sure you want to delete this signal? This cannot be undone."
                confirmLabel="Delete"
                isDestructive={true}
                onConfirm={executeDelete}
                onCancel={() => setDeleteId(null)}
            />

            {/* Clear All Signals Modal */}
            <ConfirmationModal
                isOpen={isClearAllOpen}
                title="Clear All Signals?"
                message={`Are you sure you want to delete ALL ${(allSignals?.length || 0)} signals? This action is irreversible and will remove all extracted transaction data.`}
                confirmLabel="Clear All Data"
                isDestructive={true}
                onConfirm={executeClearAll}
                onCancel={() => setIsClearAllOpen(false)}
            />
        </div>
    );
};

import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { db } from '@/lib/db';
import type { InvestmentAccount, FinancialSignal } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Plus, Pencil } from 'lucide-react';
import './Investments.css';

export const Investments: React.FC = () => {
    const accounts = useLiveQuery(() => db.investments.toArray());
    const [editingAccount, setEditingAccount] = useState<Partial<InvestmentAccount> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [projectionYears, setProjectionYears] = useState<number>(30);
    const [chartMode, setChartMode] = useState<'aggregate' | 'breakdown'>('aggregate');

    const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#f43f5e'];

    const handleEdit = (account: InvestmentAccount) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    }

    const handleAddNew = () => {
        setEditingAccount({
            name: '',
            currentBalance: 0,
            monthlyContribution: 0,
            annualGrowthRate: 7
        });
        setIsModalOpen(true);
    }

    const handleSave = async () => {
        if (!editingAccount || !editingAccount.name) return;

        const accountData = {
            ...editingAccount,
            currentBalance: Number(editingAccount.currentBalance),
            monthlyContribution: Number(editingAccount.monthlyContribution),
            annualGrowthRate: Number(editingAccount.annualGrowthRate)
        } as InvestmentAccount;

        // 1. Create or Update Signal
        // If there is a monthly contribution, we want to track it as a signal
        if (accountData.monthlyContribution > 0) {
            const signalData: FinancialSignal = {
                id: accountData.signalId, // Use existing ID if updating
                date: new Date().toISOString(), // Use current date for 'active' signal reference
                amount: accountData.monthlyContribution,
                currency: 'USD',
                flow: 'outflow',
                nature: 'fixed_recurring',
                frequency: 'monthly',
                merchant: accountData.name,
                category: 'Investments',
                createdAt: Date.now()
            };

            // If it's a new signal (no ID), add it. If existing, put it.
            if (signalData.id) {
                await db.signals.put(signalData);
            } else {
                // Generate a new UUID if needed, or let Dexie handle auto-increment if number.
                // But our signal IDs are often UUID strings from file uploads.
                // For manually created ones, let's use a simple unique string or let Dexie auto-gen if we change schema to number using ++id.
                // Our schema is ++id (auto-increment number) for signals? Let's check db.ts
                // db.ts says `signals: '++id, ...'` so it's a number.
                // Wait, the FinancialSignal interface says `id?: string`.
                // Dexie `++id` usually generates numbers. Let's assume number for consistency or string UUID.
                // If the interface says string, we should probably use UUID.
                // Let's create a UUID here for robustness.
                const newId = crypto.randomUUID();
                signalData.id = newId;
                accountData.signalId = newId;
                await db.signals.add(signalData);
            }
        }

        // 2. Save Investment Account
        if (accountData.id) {
            await db.investments.put(accountData);
        } else {
            await db.investments.add(accountData);
        }

        setIsModalOpen(false);
        setEditingAccount(null);
    };


    const projectionData = useMemo(() => {
        if (!accounts || accounts.length === 0) return [];

        const data = [];
        const currentYear = new Date().getFullYear();

        // Create separate trackers for each account to calculate compound interest correctly individually
        let accountStates = accounts.map(acc => ({
            id: acc.id,
            balance: acc.currentBalance,
            contribution: acc.monthlyContribution,
            // Standard Compound Interest Formula uses APR (Annual Rate / 12)
            // This aligns with standard financial calculators (like the one in your screenshot)
            monthlyRate: acc.annualGrowthRate / 100 / 12,
            invested: acc.currentBalance
        }));

        for (let year = 0; year <= projectionYears; year++) {

            const yearTotalBalance = accountStates.reduce((sum, acc) => sum + acc.balance, 0);
            const yearTotalInvested = accountStates.reduce((sum, acc) => sum + acc.invested, 0);

            // Construct data point with totals and individual account balances
            const dataPoint: any = {
                year: currentYear + year,
                amount: Math.round(yearTotalBalance),
                invested: Math.round(yearTotalInvested)
            };

            // Add individual account balances to data point
            accountStates.forEach(acc => {
                if (acc.id) {
                    dataPoint[acc.id] = Math.round(acc.balance);
                }
            });

            data.push(dataPoint);

            // Advance one year
            accountStates.forEach(acc => {
                for (let m = 0; m < 12; m++) {
                    // Apply interest first (start of month balance grows), then add contribution (end of month)
                    // This is slightly more conservative than (balance + contribution) * rate
                    const interest = acc.balance * acc.monthlyRate;
                    acc.balance = acc.balance + interest + acc.contribution;
                    acc.invested += acc.contribution;
                }
            });
        }
        return data;
    }, [accounts, projectionYears]);

    const finalAmount = projectionData.length > 0 ? projectionData[projectionData.length - 1].amount : 0;
    const totalInvested = projectionData.length > 0 ? projectionData[projectionData.length - 1].invested : 0;
    const totalInterest = finalAmount - totalInvested;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    return (
        <div className="investments-page">
            <div className="investments-header">
                <h1>Investment Projections</h1>
                <p>Manage your portfolios and project future wealth.</p>
            </div>

            <div className="investments-content">
                <div className="investments-controls">
                    <div className="investments-list-header">
                        <h2>Accounts</h2>
                    </div>

                    <div className="investments-list">
                        {accounts?.map(account => (
                            <div key={account.id} className="investment-card" onClick={() => handleEdit(account)}>
                                <div className="card-content">
                                    <span className="card-title">{account.name}</span>
                                    <span className="card-subtitle">{formatCurrency(account.currentBalance)} • {account.annualGrowthRate}% APY</span>
                                </div>
                                <Pencil size={16} className="text-gray-400" style={{ color: '#a1a1aa' }} />
                            </div>
                        ))}

                        {(!accounts || accounts.length === 0) && (
                            <p style={{ color: '#71717a', fontStyle: 'italic', fontSize: '0.875rem' }}>No accounts added yet.</p>
                        )}
                    </div>

                    <button className="add-account-btn" onClick={handleAddNew}>
                        <Plus size={18} />
                        Add Account
                    </button>

                    <div className="control-group" style={{ marginTop: '2rem' }}>
                        <label>Projection Years: {projectionYears}</label>
                        <input
                            type="range"
                            min="5"
                            max="50"
                            value={projectionYears}
                            onChange={(e) => setProjectionYears(Number(e.target.value))}
                            className="range-input"
                        />
                    </div>
                </div>

                <div className="projection-chart-container">
                    <div className="chart-header">
                        <div className="chart-stats">
                            <div className="stat-item">
                                <span className="stat-label">Portfolio Value</span>
                                <span className="stat-value highlight">{formatCurrency(finalAmount)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Cash Invested</span>
                                <span className="stat-value">{formatCurrency(totalInvested)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Total Growth</span>
                                <span className="stat-value">{formatCurrency(totalInterest)}</span>
                            </div>
                        </div>
                        <div className="chart-toggles">
                            <button
                                className={`toggle-btn ${chartMode === 'aggregate' ? 'active' : ''}`}
                                onClick={() => setChartMode('aggregate')}
                            >
                                Total
                            </button>
                            <button
                                className={`toggle-btn ${chartMode === 'breakdown' ? 'active' : ''}`}
                                onClick={() => setChartMode('breakdown')}
                            >
                                Breakdown
                            </button>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={projectionData}
                            margin={{
                                top: 10,
                                right: 30,
                                left: 0,
                                bottom: 0,
                            }}
                        >
                            <defs>
                                <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="year"
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fill: 'rgba(255,255,255,0.5)' }}
                                tickFormatter={(value) => `$${value / 1000}k`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(23, 23, 23, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    color: '#fff'
                                }}
                                formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                            />
                            {chartMode === 'aggregate' ? (
                                <>
                                    <Area
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#6366f1"
                                        fillOpacity={1}
                                        fill="url(#colorAmount)"
                                        name="Portfolio Value"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="invested"
                                        stroke="#10b981"
                                        fillOpacity={1}
                                        fill="url(#colorInvested)"
                                        name="Cash Invested"
                                    />
                                </>
                            ) : (
                                accounts?.map((account, index) => (
                                    <Area
                                        key={account.id}
                                        type="monotone"
                                        dataKey={String(account.id)}
                                        stackId="1"
                                        stroke={COLORS[index % COLORS.length]}
                                        fill={COLORS[index % COLORS.length]}
                                        name={account.name}
                                    />
                                ))
                            )}
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {isModalOpen && editingAccount && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2 className="modal-title">
                            {editingAccount.id ? 'Edit Account' : 'Add Investment Account'}
                        </h2>

                        <div className="modal-form">
                            <div className="form-group">
                                <label>Account Name</label>
                                <input
                                    type="text"
                                    value={editingAccount.name}
                                    onChange={e => setEditingAccount({ ...editingAccount, name: e.target.value })}
                                    className="form-input"
                                    placeholder="e.g. Robinhood"
                                />
                            </div>
                            <div className="form-group">
                                <label>Current Balance</label>
                                <div className="form-input-wrapper">
                                    <span className="input-prefix">$</span>
                                    <input
                                        type="number"
                                        value={editingAccount.currentBalance}
                                        onChange={e => setEditingAccount({ ...editingAccount, currentBalance: Number(e.target.value) })}
                                        className="form-input has-prefix"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Monthly Contribution</label>
                                <div className="form-input-wrapper">
                                    <span className="input-prefix">$</span>
                                    <input
                                        type="number"
                                        value={editingAccount.monthlyContribution}
                                        onChange={e => setEditingAccount({ ...editingAccount, monthlyContribution: Number(e.target.value) })}
                                        className="form-input has-prefix"
                                    />
                                </div>
                                <p className="form-helper-text">This will be tracked as a recurring expense signal.</p>
                            </div>
                            <div className="form-group">
                                <label>Annual Growth Rate</label>
                                <div className="form-input-wrapper">
                                    <input
                                        type="number"
                                        value={editingAccount.annualGrowthRate}
                                        onChange={e => setEditingAccount({ ...editingAccount, annualGrowthRate: Number(e.target.value) })}
                                        className="form-input has-suffix"
                                        step="0.1"
                                    />
                                    <span className="input-suffix">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="btn-cancel"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-save"
                            >
                                Save Account
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

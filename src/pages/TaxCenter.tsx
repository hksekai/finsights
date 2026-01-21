import { useState } from 'react';
import { FileText, Plus, X, FileCheck, Trash2 } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { db } from '@/lib/db';
import { PageHeader } from '@/components/ui/PageHeader';
import { TaxDocumentUploader } from '@/components/tax/TaxDocumentUploader';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { format } from 'date-fns';
import './TaxCenter.css';

const TaxStrategies = ({ summary }: { summary: any }) => {
    const [saltCap, setSaltCap] = useState(40000); // User requested specific cap
    const [numChildren, setNumChildren] = useState(0);
    const [childCareExpenses, setChildCareExpenses] = useState(0);
    const [filingStatus, setFilingStatus] = useState<'single' | 'joint'>('single');

    // Constants (Simplified for estimation)
    const STANDARD_DEDUCTION = filingStatus === 'single' ? 14600 : 29200; // 2024/2025 approx
    const CHILD_TAX_CREDIT_PER_CHILD = 2000;
    const CHILD_CARE_CREDIT_PCT = 0.20; // Conservative estimate

    // Calculations
    const totalStateAndLocalTax = summary.stateTax + summary.propertyTax;
    const deductibleSALT = Math.min(totalStateAndLocalTax, saltCap);

    // For itemizing to make sense, we need more deductions usually (mortgage interest etc), 
    // but here we just compare SALT vs Standard to show the impact/gap.
    const isItemizingBetter = deductibleSALT > STANDARD_DEDUCTION;

    const estimatedChildTaxCredit = numChildren * CHILD_TAX_CREDIT_PER_CHILD;
    const estimatedChildCareCredit = childCareExpenses * CHILD_CARE_CREDIT_PCT;
    const totalCredits = estimatedChildTaxCredit + estimatedChildCareCredit;

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    return (
        <div className="tax-strategies-section">
            <h3 className="tax-section-title">Deep Tax Insights & Strategies</h3>

            <div className="strategies-grid">
                {/* Configuration Panel */}
                <div className="strategy-card config-panel">
                    <h4 className="strategy-title">Your Scenario</h4>

                    <div className="strategy-form-group">
                        <label>Filing Status</label>
                        <div className="toggle-group">
                            <button
                                className={`toggle-btn ${filingStatus === 'single' ? 'active' : ''}`}
                                onClick={() => setFilingStatus('single')}
                            >
                                Single
                            </button>
                            <button
                                className={`toggle-btn ${filingStatus === 'joint' ? 'active' : ''}`}
                                onClick={() => setFilingStatus('joint')}
                            >
                                Married Joint
                            </button>
                        </div>
                    </div>

                    <div className="strategy-form-group">
                        <label>SALT Deduction Cap</label>
                        <div className="input-with-prefix">
                            <span>$</span>
                            <input
                                type="number"
                                value={saltCap}
                                onChange={(e) => setSaltCap(Number(e.target.value))}
                            />
                        </div>
                        <p className="strategy-help-text">Standard is $10k, but you can adjust for proposed changes.</p>
                    </div>

                    <div className="strategy-form-group">
                        <label>Number of Qualifying Children</label>
                        <input
                            type="number"
                            min="0"
                            max="10"
                            value={numChildren}
                            onChange={(e) => setNumChildren(Number(e.target.value))}
                        />
                    </div>

                    <div className="strategy-form-group">
                        <label>Annual Child Care Expenses</label>
                        <div className="input-with-prefix">
                            <span>$</span>
                            <input
                                type="number"
                                min="0"
                                value={childCareExpenses}
                                onChange={(e) => setChildCareExpenses(Number(e.target.value))}
                            />
                        </div>
                    </div>
                </div>

                {/* SALT Analysis Panel */}
                <div className="strategy-card analysis-panel">
                    <h4 className="strategy-title">Deduction Analysis (SALT)</h4>

                    <div className="analysis-row">
                        <span>Period Property Taxes Paid</span>
                        <span className="value">{formatCurrency(summary.propertyTax)}</span>
                    </div>
                    <div className="analysis-row">
                        <span>Period State Income Tax</span>
                        <span className="value">{formatCurrency(summary.stateTax)}</span>
                    </div>
                    <div className="analysis-divider" />
                    <div className="analysis-row highlight">
                        <span>Total Paid (SALT)</span>
                        <span className="value">{formatCurrency(totalStateAndLocalTax)}</span>
                    </div>

                    <div className="deduction-comparison">
                        <div className={`comparison-box ${isItemizingBetter ? 'winner' : ''}`}>
                            <span className="label">Itemized (SALT Only)</span>
                            <span className="amount">{formatCurrency(deductibleSALT)}</span>
                            {totalStateAndLocalTax > saltCap && (
                                <span className="warning-pill">Capped at {formatCurrency(saltCap)}</span>
                            )}
                        </div>
                        <div className="vs-badge">VS</div>
                        <div className={`comparison-box ${!isItemizingBetter ? 'winner' : ''}`}>
                            <span className="label">Standard Deduction</span>
                            <span className="amount">{formatCurrency(STANDARD_DEDUCTION)}</span>
                        </div>
                    </div>

                    <p className="analysis-insight">
                        {isItemizingBetter
                            ? "Your SALT payments exceed the standard deduction. Itemizing might save you more."
                            : "The Standard Deduction is currently higher than your deductible SALT payments."}
                    </p>
                </div>

                {/* Credits Panel */}
                <div className="strategy-card credits-panel">
                    <h4 className="strategy-title">Estimated Credits</h4>

                    <div className="credit-item">
                        <div className="credit-header">
                            <span>Child Tax Credit</span>
                            <span className="credit-amount">{formatCurrency(estimatedChildTaxCredit)}</span>
                        </div>
                        <div className="credit-bar-bg">
                            <div className="credit-bar-fill" style={{ width: `${Math.min(100, (estimatedChildTaxCredit / 10000) * 100)}%` }} />
                        </div>
                    </div>

                    <div className="credit-item">
                        <div className="credit-header">
                            <span>Child Care Credit (Est.)</span>
                            <span className="credit-amount">{formatCurrency(estimatedChildCareCredit)}</span>
                        </div>
                        <div className="credit-bar-bg">
                            <div className="credit-bar-fill" style={{ width: `${Math.min(100, (estimatedChildCareCredit / 6000) * 100)}%` }} />
                        </div>
                    </div>

                    <div className="total-savings">
                        <span className="label">Potential Tax Savings</span>
                        <span className="value">{formatCurrency(totalCredits)}</span>
                    </div>
                    <p className="strategy-help-text">Directly reduces your tax bill, unlike deductions.</p>
                </div>
            </div>
        </div>
    );
};

export const TaxCenter = () => {
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        docId: number | null;
    }>({ isOpen: false, docId: null });

    const executeDelete = async () => {
        if (!confirmState.docId) return;

        try {
            await db.transaction('rw', db.tax_documents, db.tax_insights, async () => {
                await db.tax_documents.delete(confirmState.docId!);
                await db.tax_insights.where('docId').equals(confirmState.docId!).delete();
            });
            setConfirmState({ isOpen: false, docId: null });
        } catch (err) {
            console.error("Failed to delete tax document:", err);
        }
    };

    // Fetch documents and insights
    const taxDocs = useLiveQuery(() => db.tax_documents.orderBy('uploadedAt').reverse().toArray());
    const insights = useLiveQuery(() => db.tax_insights.toArray());

    // Calculate Summary Stats
    const summary = (insights || []).reduce((acc, insight) => {
        if (insight.type === 'extraction' && insight.data && insight.data.data) {
            const d = insight.data.data;
            acc.grossIncome += d.grossIncome || 0;
            acc.federalTax += d.federalTaxWithheld || 0;
            acc.stateTax += d.stateTaxWithheld || 0;
            acc.propertyTax += d.propertyTaxAmount || 0;
        }
        return acc;
    }, { grossIncome: 0, federalTax: 0, stateTax: 0, propertyTax: 0 });

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return (
        <div className="tax-center-page">
            <PageHeader
                title="Tax Center"
                subtitle="Manage tax documents and get AI-driven insights for the tax season."
            >
                <div>
                    <button className="btn-primary" onClick={() => setIsUploadOpen(true)}>
                        <Plus size={16} />
                        <span>Upload Documents</span>
                    </button>
                </div>
            </PageHeader>

            <div className="content-container">
                {/* Summary Cards */}
                {(taxDocs?.length || 0) > 0 && (
                    <div className="tax-insights-summary">
                        <div className="tax-stat-card">
                            <div className="tax-stat-label">Total Gross Income</div>
                            <div className="tax-stat-value text-gradient">{formatCurrency(summary.grossIncome)}</div>
                        </div>
                        <div className="tax-stat-card">
                            <div className="tax-stat-label">Federal Tax Withheld</div>
                            <div className="tax-stat-value">{formatCurrency(summary.federalTax)}</div>
                        </div>
                        <div className="tax-stat-card">
                            <div className="tax-stat-label">State Tax Withheld</div>
                            <div className="tax-stat-value">{formatCurrency(summary.stateTax)}</div>
                        </div>
                        <div className="tax-stat-card">
                            <div className="tax-stat-label">Property Taxes</div>
                            <div className="tax-stat-value">{formatCurrency(summary.propertyTax)}</div>
                        </div>
                    </div>
                )}

                {(taxDocs?.length || 0) > 0 && (
                    <div className="tax-charts-section">
                        <h3 className="tax-section-title">Income & Tax Breakdown</h3>
                        <div className="tax-charts-grid">
                            <div className="tax-chart-card">
                                <h4 className="tax-chart-title">Tax Distribution</h4>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: 'Federal Tax', value: summary.federalTax },
                                                    { name: 'State Tax', value: summary.stateTax },
                                                    { name: 'Property Tax', value: summary.propertyTax },
                                                    { name: 'Net Income', value: Math.max(0, summary.grossIncome - (summary.federalTax + summary.stateTax + summary.propertyTax)) }
                                                ].filter(d => d.value > 0)}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {/* Colors: Red, Orange, Blue, Green */}
                                                <Cell fill="#ef4444" />
                                                <Cell fill="#f97316" />
                                                <Cell fill="#3b82f6" />
                                                <Cell fill="#22c55e" />
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => formatCurrency(Number(value || 0))}
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                            />
                                            <Legend verticalAlign="bottom" height={36} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="tax-chart-card">
                                <h4 className="tax-chart-title">Gross vs Net</h4>
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <BarChart
                                            data={[
                                                { name: 'Gross', value: summary.grossIncome },
                                                { name: 'Net', value: Math.max(0, summary.grossIncome - (summary.federalTax + summary.stateTax + summary.propertyTax)) }
                                            ]}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                            <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} />
                                            <YAxis
                                                stroke="#94a3b8"
                                                tickFormatter={(val) => `$${val / 1000}k`}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Amount']}
                                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                                itemStyle={{ color: '#f8fafc' }}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                <Cell fill="#3b82f6" />
                                                <Cell fill="#22c55e" />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Tax Strategies */}
                {(taxDocs?.length || 0) > 0 && <TaxStrategies summary={summary} />}

                {/* Main Content */}
                {(taxDocs?.length || 0) === 0 ? (
                    <div className="tax-empty-state">
                        <div className="tax-empty-icon">
                            <FileText size={32} />
                        </div>
                        <h3 className="tax-empty-title">No Tax Documents Yet</h3>
                        <p className="tax-empty-desc">
                            Upload your W2s, 1099s, and other tax content to generate insights and track your liabilities.
                        </p>
                        <button className="btn-secondary" onClick={() => setIsUploadOpen(true)}>
                            Start Uploading
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="tax-section-title">Uploaded Documents</h3>
                        <div className="tax-docs-list">
                            {taxDocs?.map(doc => (
                                <div key={doc.id} className="tax-doc-card">
                                    <div className="tax-doc-icon">
                                        <FileCheck size={20} />
                                    </div>
                                    <div className="tax-doc-info">
                                        <div className="tax-doc-name">{doc.fileName}</div>
                                        <div className="tax-doc-meta">
                                            {doc.docType.toUpperCase()} • {doc.taxYear} • {format(doc.uploadedAt, 'MMM d, yyyy')}
                                        </div>
                                    </div>
                                    <button
                                        className="tax-doc-delete-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmState({ isOpen: true, docId: doc.id! });
                                        }}
                                        title="Delete Document"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            {isUploadOpen && (
                <div className="tax-modal-overlay" onClick={() => setIsUploadOpen(false)}>
                    <div className="tax-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="tax-modal-header">
                            <h2 className="tax-modal-title">Upload Tax Document</h2>
                            <button className="tax-modal-close" onClick={() => setIsUploadOpen(false)}>
                                <X size={20} />
                            </button>
                        </div>

                        <TaxDocumentUploader onUploadComplete={() => setIsUploadOpen(false)} />
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmState.isOpen}
                title="Delete Tax Document?"
                message="Are you sure you want to delete this document? This will also remove any associated tax insights and calculations. This action cannot be undone."
                confirmLabel="Delete Document"
                isDestructive={true}
                onConfirm={executeDelete}
                onCancel={() => setConfirmState({ isOpen: false, docId: null })}
            />
        </div>
    );
};

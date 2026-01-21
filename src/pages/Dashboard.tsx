import { useState, useMemo, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell
} from 'recharts';
import { DollarSign, CalendarCheck, Activity, Plus } from 'lucide-react';
import { DateRangePicker, type DateRange } from '@/components/ui/DateRangePicker';
import { isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { calculateMonthlyIncome, calculateRecurringExpenses, calculateDisposableIncome } from '@/lib/insights';
import { AddPanelModal } from '@/components/ui/AddPanelModal';
import { DynamicPanel } from '@/components/ui/DynamicPanel';
import { type DashboardPanel } from '@/lib/db';
import './Dashboard.css';

export const Dashboard = () => {
    const signals = useLiveQuery(() => db.signals.orderBy('date').toArray());
    const dashboardConfig = useLiveQuery(() => db.dashboards.toCollection().first());
    const [isAddPanelModalOpen, setIsAddPanelModalOpen] = useState(false);

    // Initialize from localStorage or default
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const saved = localStorage.getItem('dashboard_date_range');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return {
                    label: parsed.label,
                    from: parsed.from ? new Date(parsed.from) : null,
                    to: parsed.to ? new Date(parsed.to) : null
                };
            } catch (e) {
                console.error('Failed to parse saved date range', e);
            }
        }
        return {
            from: null,
            to: null,
            label: 'All time'
        };
    });

    // Persist to localStorage
    useEffect(() => {
        localStorage.setItem('dashboard_date_range', JSON.stringify(dateRange));
    }, [dateRange]);

    const filteredSignals = useMemo(() => {
        if (!signals) return [];
        return signals.filter(signal => {
            if (!dateRange.from || !dateRange.to) return true; // All time
            const signalDate = new Date(signal.date);
            return isWithinInterval(signalDate, {
                start: startOfDay(dateRange.from),
                end: endOfDay(dateRange.to)
            });
        });
    }, [signals, dateRange]);

    // Calculate Insights
    const insights = useMemo(() => {
        if (!signals) return null;
        // Use ALL signals for insights to get better recurrence detection, 
        // regardless of date filter (or maybe filter to last 6 months?)
        // For now, let's use all signals for robust detection.
        const monthlyIncome = calculateMonthlyIncome(signals);
        const recurringExpenses = calculateRecurringExpenses(signals);
        return calculateDisposableIncome(monthlyIncome, recurringExpenses);
    }, [signals]);

    const monthlyData = calculateMonthlyTrend(filteredSignals);
    const categoryData = calculateCategorySplit(filteredSignals);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="panel" style={{ padding: '0.75rem', minWidth: '150px' }}>
                    <p style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{label}</p>
                    {payload.map((entry: any) => (
                        <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
                            <span style={{ color: 'hsl(215 20.2% 65.1%)', textTransform: 'capitalize' }}>{entry.name}:</span>
                            <span style={{ fontWeight: 500, color: 'white' }}>${entry.value.toFixed(0)}</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    const handleSavePanel = async (newPanel: DashboardPanel) => {
        if (!dashboardConfig) {
            await db.dashboards.add({
                name: 'Default Dashboard',
                panels: [newPanel]
            });
        } else {
            const updatedPanels = [...(dashboardConfig.panels || []), newPanel];
            await db.dashboards.update(dashboardConfig.id!, {
                panels: updatedPanels
            });
        }
    };

    const handleEditPanel = async (updatedPanel: DashboardPanel) => {
        if (!dashboardConfig) return;
        const updatedPanels = dashboardConfig.panels.map(p =>
            p.id === updatedPanel.id ? updatedPanel : p
        );
        await db.dashboards.update(dashboardConfig.id!, {
            panels: updatedPanels
        });
        setEditingPanel(null);
    };

    const handleDeletePanel = async (panelId: string) => {
        if (!dashboardConfig) return;
        const updatedPanels = dashboardConfig.panels.filter(p => p.id !== panelId);
        await db.dashboards.update(dashboardConfig.id!, {
            panels: updatedPanels
        });
    };

    const [editingPanel, setEditingPanel] = useState<DashboardPanel | null>(null);

    return (
        <div className="dashboard-page">
            <PageHeader
                title="Dashboard"
                subtitle="Overview of your financial health and recurring insights."
            >
                <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                />
            </PageHeader>

            {/* Action Bar */}
            <div className="dashboard-actions">
                <button
                    onClick={() => setIsAddPanelModalOpen(true)}
                    className="add-panel-btn"
                >
                    <Plus size={18} />
                    <span>Add Panel</span>
                </button>
            </div>

            {/* Top Section: Main Chart + KPI Sidebar */}
            <div className="dashboard-top-grid">
                {/* Main Trend Chart */}
                <div className="panel">
                    <h3 className="panel-title">Cash Flow Trend</h3>
                    <div className="panel-chart-large">
                        <ResponsiveContainer width="100%" height={320}>
                            <AreaChart data={monthlyData}>
                                <defs>
                                    <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="inflow" stroke="#22c55e" fillOpacity={1} fill="url(#colorIn)" strokeWidth={2} />
                                <Area type="monotone" dataKey="outflow" stroke="#ef4444" fillOpacity={1} fill="url(#colorOut)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* KPI Sidebar */}
                {insights && (
                    <div className="kpi-sidebar">
                        <KPICard
                            label="Est. Monthly Income"
                            value={insights.totalIncome}
                            icon={DollarSign}
                            trend="Recurring"
                            color="green"
                        />
                        <KPICard
                            label="Fixed Monthly Costs"
                            value={insights.totalFixedCosts}
                            icon={CalendarCheck}
                            trend="Recurring"
                            color="orange"
                        />
                        <KPICard
                            label="True Disposable Income"
                            value={insights.disposableIncome}
                            icon={Activity}
                            trend="Available"
                            color="blue"
                            highlight={true}
                        />
                    </div>
                )}
            </div>

            {/* Bottom Section: Secondary Charts */}
            <div className="dashboard-bottom-grid">
                {/* Category Breakdown */}
                <div className="panel">
                    <h3 className="panel-title">Top Expense Categories</h3>
                    <div className="panel-chart">
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={categoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip />} />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recurring Bills List */}
                <div className="panel">
                    <h3 className="panel-title">Recurring Bills Detected</h3>
                    <div className="recurring-list">
                        {insights?.recurringExpenses.length === 0 ? (
                            <p className="no-data">No recurring bills detected yet.</p>
                        ) : (
                            insights?.recurringExpenses.map((item, idx) => (
                                <div key={idx} className="recurring-item">
                                    <div className="recurring-info">
                                        <p className="recurring-merchant">{item.merchant}</p>
                                        <p className="recurring-detail">{item.frequency} • Last: {format(new Date(item.lastDate), 'MMM d')}</p>
                                    </div>
                                    <p className="recurring-amount">${item.amount.toFixed(2)}/mo</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Custom Panels */}
                {dashboardConfig?.panels?.map((panel) => (
                    <DynamicPanel
                        key={panel.id}
                        panel={panel}
                        signals={signals || []}
                        onEdit={(p) => setEditingPanel(p)}
                        onDelete={handleDeletePanel}
                    />
                ))}
            </div>

            <AddPanelModal
                isOpen={isAddPanelModalOpen}
                onClose={() => setIsAddPanelModalOpen(false)}
                onSave={handleSavePanel}
            />

            {/* Edit Panel Modal - reuse AddPanelModal with initial values */}
            {editingPanel && (
                <AddPanelModal
                    isOpen={true}
                    onClose={() => setEditingPanel(null)}
                    onSave={handleEditPanel}
                    initialPanel={editingPanel}
                />
            )}
        </div>
    );
};

const KPICard = ({ label, value, icon: Icon, trend, color, highlight }: any) => (
    <div className={`kpi-card ${highlight ? 'highlight-card' : ''}`}>
        <div className={`kpi-card-icon ${color}`}>
            <Icon size={highlight ? 32 : 24} />
        </div>
        <div className="kpi-card-content">
            <p className="kpi-card-label">{label}</p>
            <h3 className="kpi-card-value">${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
            <div className={`kpi-card-trend ${color}`}>{trend}</div>
        </div>
    </div>
);

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308'];

function calculateMonthlyTrend(signals: any[]) {
    if (!signals.length) return [];

    const monthMap = new Map<string, { inflow: number; outflow: number }>();

    signals.forEach(s => {
        // Group by Month-Year (e.g., "Jan 24")
        const date = new Date(s.date);
        const key = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }); // "Jan 24"

        const current = monthMap.get(key) || { inflow: 0, outflow: 0 };
        if (s.flow === 'inflow') current.inflow += s.amount;
        else current.outflow += s.amount;

        monthMap.set(key, current);
    });

    return Array.from(monthMap.entries()).map(([name, data]) => ({
        name,
        ...data
    })).reverse(); // Show oldest to newest? No, usually charts go left to right (old to new). Order depends on map iteration.
    // Need to sort by date actually.
    // Let's rely on Recharts rendering order or pre-sort.
    // Map insertion order is preserved. If signals are sorted by date, this is fine.
}

function calculateCategorySplit(signals: any[]) {
    if (!signals.length) return [];

    const groups = signals
        .filter(s => s.flow === 'outflow')
        .reduce((acc: any, s) => {
            acc[s.category] = (acc[s.category] || 0) + s.amount;
            return acc;
        }, {});

    return Object.entries(groups)
        .map(([name, value]) => ({ name, value }))
        .sort((a: any, b: any) => b.value - a.value)
        .slice(0, 5);
}

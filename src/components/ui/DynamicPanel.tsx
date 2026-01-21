import { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell, Label, Sector } from 'recharts';
import { type DashboardPanel, type FinancialSignal } from '@/lib/db';
import { format, subDays, startOfMonth, startOfYear, isWithinInterval } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import './DynamicPanel.css';

interface DynamicPanelProps {
    panel: DashboardPanel;
    signals: FinancialSignal[];
    onEdit?: (panel: DashboardPanel) => void;
    onDelete?: (panelId: string) => void;
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e'];

export function DynamicPanel({ panel, signals, onEdit, onDelete }: DynamicPanelProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate = subDays(now, 30);

        if (panel.query.timeRange === '90_days') startDate = subDays(now, 90);
        if (panel.query.timeRange === 'this_month') startDate = startOfMonth(now);
        if (panel.query.timeRange === 'this_year') startDate = startOfYear(now);

        return signals.filter(s => {
            const signalDate = new Date(s.date);
            return isWithinInterval(signalDate, { start: startDate, end: now });
        });
    }, [signals, panel.query.timeRange]);

    const chartData = useMemo(() => {
        const groups: Record<string, number> = {};

        filteredData.forEach(signal => {
            let key = 'Unknown';
            if (panel.query.groupBy === 'category') key = signal.category || 'Uncategorized';
            if (panel.query.groupBy === 'merchant') key = signal.merchant || 'Unknown';
            if (panel.query.groupBy === 'date') key = format(new Date(signal.date), 'MMM dd');
            if (panel.query.groupBy === 'custom_groups') {
                const group = panel.query.customGroups?.find(g => g.categories.includes(signal.category));
                key = group ? group.name : 'Other';
            }

            if (!groups[key]) groups[key] = 0;

            if (panel.query.metric === 'count') {
                groups[key]++;
            } else {
                groups[key] += Math.abs(signal.amount);
            }
        });

        return Object.entries(groups).map(([name, value]) => ({ name, value }));
    }, [filteredData, panel.query.groupBy, panel.query.metric, panel.query.customGroups]);

    const handleEdit = () => {
        setIsMenuOpen(false);
        onEdit?.(panel);
    };

    const handleDelete = () => {
        setIsMenuOpen(false);
        onDelete?.(panel.id);
    };

    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const renderChart = () => {
        switch (panel.type) {
            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => panel.presentation.units === 'currency' ? `$${val}` : `${val}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                                formatter={(value: any, name: any) => [
                                    typeof value === 'number'
                                        ? (panel.presentation.units === 'currency'
                                            ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                            : value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }))
                                        : value,
                                    name
                                ]}
                            />
                            <Bar dataKey="value" fill={panel.presentation.color || '#3b82f6'} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                );
            case 'line':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => panel.presentation.units === 'currency' ? `$${val}` : `${val}`}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: '#f8fafc' }}
                                formatter={(value: any, name: any) => [
                                    typeof value === 'number'
                                        ? (panel.presentation.units === 'currency'
                                            ? `$${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
                                            : value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }))
                                        : value,
                                    name
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={panel.presentation.color || '#3b82f6'}
                                strokeWidth={3}
                                dot={{ r: 4, strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                );
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={3}
                                dataKey="value"
                                // @ts-ignore
                                activeIndex={activeIndex !== null ? activeIndex : undefined}
                                activeShape={(props: any) => {
                                    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                                    return (
                                        <g>
                                            <Sector
                                                cx={cx}
                                                cy={cy}
                                                innerRadius={innerRadius}
                                                outerRadius={outerRadius + 6}
                                                startAngle={startAngle}
                                                endAngle={endAngle}
                                                fill={fill}
                                            />
                                            <Sector
                                                cx={cx}
                                                cy={cy}
                                                startAngle={startAngle}
                                                endAngle={endAngle}
                                                innerRadius={outerRadius + 6}
                                                outerRadius={outerRadius + 10}
                                                fill={fill}
                                            />
                                        </g>
                                    );
                                }}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                                <Label
                                    position="center"
                                    content={({ viewBox }) => {
                                        const { width, height } = viewBox as { width: number, height: number };
                                        const cx = width / 2;
                                        const cy = height / 2;

                                        if (activeIndex !== null && chartData[activeIndex]) {
                                            const item = chartData[activeIndex];
                                            const valueStr = panel.presentation.units === 'currency'
                                                ? `$${item.value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                                : item.value.toLocaleString();

                                            // Split text into two lines if needed or keep compact
                                            return (
                                                <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                                    <tspan x={cx} dy="-0.5em" fontSize="12" fill="#94a3b8">{item.name}</tspan>
                                                    <tspan x={cx} dy="1.2em" fontSize="16" fontWeight="600" fill="#f8fafc">{valueStr}</tspan>
                                                </text>
                                            );
                                        }

                                        // Default text when no hover (optional, user didn't request but good for UX)
                                        // User only asked for hover behavior, so maybe leave empty or show Total
                                        const total = chartData.reduce((sum, item) => sum + item.value, 0);
                                        const totalStr = panel.presentation.units === 'currency'
                                            ? `$${total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                            : total.toLocaleString();

                                        return (
                                            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle">
                                                <tspan x={cx} dy="-0.5em" fontSize="10" fill="#64748b">Total</tspan>
                                                <tspan x={cx} dy="1.2em" fontSize="14" fontWeight="600" fill="#94a3b8">{totalStr}</tspan>
                                            </text>
                                        );
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                );
            case 'stat':
                const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
                return (
                    <div className="dynamic-panel-stat">
                        <div className="dynamic-panel-stat-value" style={{ color: panel.presentation.color || '#3b82f6' }}>
                            {panel.presentation.units === 'currency' ? `$${totalValue.toLocaleString()}` : totalValue.toLocaleString()}
                        </div>
                        <div className="dynamic-panel-stat-label">
                            {panel.query.metric === 'sum' ? 'Total' : panel.query.metric === 'avg' ? 'Average' : 'Count'}
                        </div>
                    </div>
                );
            default:
                return <div className="dynamic-panel-empty">Unknown Panel Type</div>;
        }
    };

    return (
        <div className="dynamic-panel">
            <div className="dynamic-panel-header">
                <h3 className="dynamic-panel-title">{panel.title}</h3>
                <div className="panel-menu-container">
                    <button
                        className="panel-menu-trigger"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <MoreHorizontal size={18} />
                    </button>
                    {isMenuOpen && (
                        <>
                            <div className="panel-menu-backdrop" onClick={() => setIsMenuOpen(false)} />
                            <div className="panel-menu-dropdown">
                                <button className="panel-menu-item" onClick={handleEdit}>
                                    <Pencil size={14} />
                                    <span>Edit</span>
                                </button>
                                <button className="panel-menu-item danger" onClick={handleDelete}>
                                    <Trash2 size={14} />
                                    <span>Remove</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className="dynamic-panel-chart">
                {renderChart()}
            </div>
        </div>
    );
}

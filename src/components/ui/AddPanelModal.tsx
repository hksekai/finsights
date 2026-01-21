import { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Activity, PieChart as PieIcon, BarChart as BarIcon, X, Plus, Trash2 } from 'lucide-react';
import { db, type DashboardPanel } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import './AddPanelModal.css';

interface AddPanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (panel: DashboardPanel) => void;
    initialPanel?: DashboardPanel; // For editing existing panels
}

const VISUALIZATIONS = [
    { id: 'stat', label: 'Stat', icon: DollarSign },
    { id: 'line', label: 'Line Chart', icon: Activity },
    { id: 'bar', label: 'Bar Chart', icon: BarIcon },
    { id: 'pie', label: 'Pie Chart', icon: PieIcon },
];

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e'];

const getDefaultConfig = (): Partial<DashboardPanel> => ({
    type: 'bar',
    title: '',
    query: {
        metric: 'sum',
        timeRange: '30_days',
        groupBy: 'category'
    },
    presentation: {
        color: COLORS[3],
        units: 'currency'
    }
});

export function AddPanelModal({ isOpen, onClose, onSave, initialPanel }: AddPanelModalProps) {
    const [config, setConfig] = useState<Partial<DashboardPanel>>(
        initialPanel || getDefaultConfig()
    );

    const existingCategories = useLiveQuery(async () => {
        const signals = await db.signals.toArray();
        const categories = new Set(signals.map(s => s.category).filter(Boolean));
        return Array.from(categories).sort();
    }, []) || [];

    // Reset config when modal opens/closes or initialPanel changes
    useEffect(() => {
        if (isOpen) {
            setConfig(initialPanel || getDefaultConfig());
        }
    }, [isOpen, initialPanel]);

    if (!isOpen) return null;

    const renderPreview = () => {
        const barLineData = [
            { name: 'Jan', value: 400 },
            { name: 'Feb', value: 300 },
            { name: 'Mar', value: 600 },
            { name: 'Apr', value: 800 },
            { name: 'May', value: 500 }
        ];

        const pieData = [
            { name: 'Dining', value: 400 },
            { name: 'Shopping', value: 300 },
            { name: 'Transport', value: 200 },
            { name: 'Entertainment', value: 150 },
            { name: 'Other', value: 100 }
        ];

        const PIE_COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#ec4899', '#22c55e'];

        return (
            <div className="live-preview-container">
                <ResponsiveContainer width="100%" height="100%">
                    {config.type === 'bar' ? (
                        <BarChart data={barLineData}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                itemStyle={{ color: config.presentation?.color }}
                            />
                            <Bar dataKey="value" fill={config.presentation?.color || '#3b82f6'} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    ) : config.type === 'line' ? (
                        <LineChart data={barLineData}>
                            <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            />
                            <Line type="monotone" dataKey="value" stroke={config.presentation?.color || '#3b82f6'} strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    ) : config.type === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                                label={({ name, percent }: any) => `${name || ''} ${((percent || 0) * 100).toFixed(0)}%`}
                                labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                            >
                                {pieData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                formatter={(value) => `$${value}`}
                            />
                        </PieChart>
                    ) : config.type === 'stat' ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '0.5rem' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 700, color: config.presentation?.color || '#3b82f6' }}>$2,600</span>
                            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Total for period</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                            Preview not available for this type yet
                        </div>
                    )}
                </ResponsiveContainer>
            </div>
        );
    };

    const handleSave = () => {
        if (config.title && config.type && config.query) {
            onSave({
                id: initialPanel?.id || crypto.randomUUID(),
                title: config.title,
                type: config.type as any,
                query: config.query as any,
                presentation: config.presentation || {}
            });
            onClose();
        }
    };

    return (
        <div className="add-panel-overlay">
            <div className="add-panel-modal">
                {/* Header */}
                <div className="add-panel-header">
                    <h2>{initialPanel ? 'Edit Panel' : 'Add New Panel'}</h2>
                    <button onClick={onClose} className="add-panel-close-btn">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="add-panel-content">
                    <div className="add-panel-grid">
                        {/* Visualization Selector */}
                        <div>
                            <h3 className="add-panel-section-title">Visualization</h3>
                            <div className="viz-grid">
                                {VISUALIZATIONS.map((vis) => (
                                    <button
                                        key={vis.id}
                                        onClick={() => setConfig({ ...config, type: vis.id as any })}
                                        className={`viz-button ${config.type === vis.id ? 'active' : ''}`}
                                    >
                                        <vis.icon size={24} />
                                        <span>{vis.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Query Builder */}
                        <div>
                            <h3 className="add-panel-section-title">Query Builder</h3>
                            <div className="add-panel-card">
                                <div className="field-group">
                                    <label className="field-label">Metric</label>
                                    <select
                                        className="field-select"
                                        value={config.query?.metric}
                                        onChange={(e) => setConfig({ ...config, query: { ...config.query!, metric: e.target.value as any } })}
                                    >
                                        <option value="sum">Sum of Amount</option>
                                        <option value="avg">Average Amount</option>
                                        <option value="count">Count of Transactions</option>
                                    </select>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Time Range</label>
                                    <select
                                        className="field-select"
                                        value={config.query?.timeRange}
                                        onChange={(e) => setConfig({ ...config, query: { ...config.query!, timeRange: e.target.value } })}
                                    >
                                        <option value="30_days">Last 30 Days</option>
                                        <option value="90_days">Last 3 Months</option>
                                        <option value="this_month">This Month</option>
                                        <option value="this_year">This Year</option>
                                    </select>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Group By</label>
                                    <select
                                        className="field-select"
                                        value={config.query?.groupBy}
                                        onChange={(e) => setConfig({ ...config, query: { ...config.query!, groupBy: e.target.value as any } })}
                                    >
                                        <option value="category">Category</option>
                                        <option value="date">Date</option>
                                        <option value="merchant">Merchant</option>
                                        <option value="custom_groups">Custom Groups</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Presentation */}
                        <div>
                            <h3 className="add-panel-section-title">Presentation</h3>
                            <div className="add-panel-card">
                                <div className="field-group">
                                    <label className="field-label">Panel Title</label>
                                    <input
                                        type="text"
                                        value={config.title}
                                        onChange={(e) => setConfig({ ...config, title: e.target.value })}
                                        placeholder="e.g. Dining Spend"
                                        className="field-input"
                                    />
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Units</label>
                                    <select
                                        className="field-select"
                                        value={config.presentation?.units}
                                        onChange={(e) => setConfig({ ...config, presentation: { ...config.presentation!, units: e.target.value } })}
                                    >
                                        <option value="currency">Currency ($)</option>
                                        <option value="number">Number</option>
                                        <option value="percent">Percent (%)</option>
                                    </select>
                                </div>

                                <div className="field-group">
                                    <label className="field-label">Color</label>
                                    <div className="color-picker">
                                        {COLORS.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setConfig({ ...config, presentation: { ...config.presentation!, color } })}
                                                className={`color-swatch ${config.presentation?.color === color ? 'active' : ''}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Custom Group Configuration */}
                    {config.query?.groupBy === 'custom_groups' && (
                        <div>
                            <h3 className="add-panel-section-title">Custom Groups</h3>
                            <div className="add-panel-card">
                                <div className="custom-groups-list">
                                    {config.query?.customGroups?.map((group, groupIndex) => (
                                        <div key={groupIndex} className="custom-group-item">
                                            <div className="group-header">
                                                <input
                                                    type="text"
                                                    value={group.name}
                                                    onChange={(e) => {
                                                        const newGroups = [...(config.query?.customGroups || [])];
                                                        newGroups[groupIndex].name = e.target.value;
                                                        setConfig({ ...config, query: { ...config.query!, customGroups: newGroups } });
                                                    }}
                                                    placeholder="Group Name"
                                                    className="group-name-input"
                                                />
                                                <button
                                                    onClick={() => {
                                                        const newGroups = config.query?.customGroups?.filter((_, i) => i !== groupIndex);
                                                        setConfig({ ...config, query: { ...config.query!, customGroups: newGroups } });
                                                    }}
                                                    className="btn-icon-danger"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="group-categories">
                                                {existingCategories?.map(cat => (
                                                    <label key={cat} className={`category-tag ${group.categories.includes(cat) ? 'selected' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={group.categories.includes(cat)}
                                                            onChange={(e) => {
                                                                const newGroups = [...(config.query?.customGroups || [])];
                                                                if (e.target.checked) {
                                                                    newGroups[groupIndex].categories.push(cat);
                                                                } else {
                                                                    newGroups[groupIndex].categories = newGroups[groupIndex].categories.filter(c => c !== cat);
                                                                }
                                                                setConfig({ ...config, query: { ...config.query!, customGroups: newGroups } });
                                                            }}
                                                            style={{ display: 'none' }}
                                                        />
                                                        {cat}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => {
                                            const newGroups = [...(config.query?.customGroups || []), { name: '', categories: [] }];
                                            setConfig({ ...config, query: { ...config.query!, customGroups: newGroups } });
                                        }}
                                        className="btn-add-group"
                                    >
                                        <Plus size={16} /> Add Group
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="live-preview-section">
                        <h3 className="add-panel-section-title">Live Preview</h3>
                        {renderPreview()}
                    </div>
                </div>

                {/* Footer */}
                <div className="add-panel-footer">
                    <button onClick={onClose} className="btn-cancel">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!config.title}
                        className="btn-save"
                    >
                        Save Panel
                    </button>
                </div>
            </div>
        </div>
    );
}

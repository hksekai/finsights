import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { useApp } from '@/lib/context/AppContext';
import { Save, Key, CreditCard, Bot, Database } from 'lucide-react';
import { seedMockData } from '@/lib/seedMockData';
import './Settings.css';

const AVAILABLE_MODELS = [
    { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash Exp (Free)' },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (Standard)' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro (Experimental)' },
    { id: 'meta-llama/llama-3.2-11b-vision-instruct:free', name: 'Llama 3.2 11B Vision (Free)' },
];

export const Settings = () => {
    const { settings, updateSettings } = useApp();
    const [apiKey, setApiKey] = useState(settings.apiKey);
    const [selectedModel, setSelectedModel] = useState(settings.model || 'google/gemini-2.0-flash-001');
    const [isSaved, setIsSaved] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [seedCount, setSeedCount] = useState<number | null>(null);

    const handleSave = () => {
        updateSettings({ apiKey, model: selectedModel });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    return (
        <div className="settings-page">
            <PageHeader
                title="Settings"
                subtitle="Manage your preferences and API keys."
            />

            <div className="settings-sections">
                {/* API Key Section */}
                <section className="settings-section">
                    <div className="settings-section-inner">
                        <div className="settings-icon">
                            <Key size={24} />
                        </div>
                        <div className="settings-content">
                            <h3 className="settings-title">OpenRouter API Key</h3>
                            <p className="settings-description">
                                We use OpenRouter to process your documents securely. Your key is stored locally in your browser and never sent to our servers.
                            </p>

                            <div className="settings-input-row">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="sk-or-v1-..."
                                    className="settings-input"
                                />
                                <button
                                    onClick={handleSave}
                                    className={`save-btn ${isSaved ? 'saved' : ''}`}
                                >
                                    <Save size={18} />
                                    {isSaved ? "Saved" : "Save Key"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Model Selection Section */}
                <section className="settings-section">
                    <div className="settings-section-inner">
                        <div className="settings-icon">
                            <Bot size={24} />
                        </div>
                        <div className="settings-content">
                            <h3 className="settings-title">AI Model</h3>
                            <p className="settings-description">
                                Select the AI model used for document analysis. Some models are free, others require paid credits.
                            </p>

                            <div className="settings-input-row">
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value)}
                                    className="form-select"
                                >
                                    {AVAILABLE_MODELS.map(model => (
                                        <option key={model.id} value={model.id}>
                                            {model.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Currency Section (Placeholder) */}
                <section className="settings-section disabled">
                    <div className="settings-section-inner">
                        <div className="settings-icon muted">
                            <CreditCard size={24} />
                        </div>
                        <div className="settings-content">
                            <h3 className="settings-title muted">Currency (Coming Soon)</h3>
                            <p className="settings-description">
                                Currently locked to USD (United States Dollar). Multi-currency support is planned for v1.1.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Developer Mode Section */}
                <section className="settings-section">
                    <div className="settings-section-inner">
                        <div className="settings-icon">
                            <Database size={24} />
                        </div>
                        <div className="settings-content">
                            <h3 className="settings-title">Developer Mode</h3>
                            <p className="settings-description">
                                Tools for testing and development.
                            </p>

                            <div className="settings-input-row">
                                <button
                                    onClick={async () => {
                                        if (isSeeding) return;
                                        if (!confirm("This will clear all existing signals and replace them with mock data. Continue?")) return;

                                        setIsSeeding(true);
                                        try {
                                            const count = await seedMockData();
                                            setSeedCount(count);
                                            alert(`Successfully seeded ${count} mock signals!`);
                                        } catch (e) {
                                            console.error(e);
                                            alert("Failed to seed data");
                                        } finally {
                                            setIsSeeding(false);
                                        }
                                    }}
                                    className="seed-btn"
                                    disabled={isSeeding}
                                >
                                    <Database size={18} />
                                    {isSeeding ? "Seeding..." : "Seed Mock Data (1 Year)"}
                                </button>
                                {seedCount !== null && (
                                    <span className="seed-status">
                                        Added {seedCount} signals
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

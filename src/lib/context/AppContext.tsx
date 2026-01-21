import React, { createContext, useContext, useEffect, useState } from 'react';

interface AppSettings {
    apiKey: string;
    currency: string;
    model: string;
}

interface AppContextType {
    settings: AppSettings;
    updateSettings: (newSettings: Partial<AppSettings>) => void;
    isLoading: boolean;
}

const defaultSettings: AppSettings = {
    apiKey: '',
    currency: 'USD',
    model: 'google/gemini-2.0-flash-001' // Default to a safe, fast model
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Load settings from localStorage
        const saved = localStorage.getItem('burnrate_settings');
        if (saved) {
            try {
                setSettings({ ...defaultSettings, ...JSON.parse(saved) });
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
        setIsLoading(false);
    }, []);

    const updateSettings = (newSettings: Partial<AppSettings>) => {
        setSettings(prev => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem('burnrate_settings', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AppContext.Provider value={{ settings, updateSettings, isLoading }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

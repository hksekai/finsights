import React, { useState, useEffect } from 'react';
import { ChevronDown, Clock } from 'lucide-react';
import { format, subDays, subYears, startOfDay, endOfDay, isValid, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import './DateRangePicker.css';

export interface DateRange {
    from: Date | null;
    to: Date | null;
    label: string;
}

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

type PresetDuration = 'week' | 'month' | '3m' | '6m' | 'year' | 'all';

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempFrom, setTempFrom] = useState<string>('');
    const [tempTo, setTempTo] = useState<string>('');

    // Update temp values when dropdown opens or value changes externally
    useEffect(() => {
        if (isOpen && value.from && value.to) {
            setTempFrom(format(value.from, 'yyyy-MM-dd'));
            setTempTo(format(value.to, 'yyyy-MM-dd'));
        }
    }, [isOpen, value]);

    const presets: { label: string; duration: PresetDuration }[] = [
        { label: 'This Week', duration: 'week' },
        { label: 'This Month', duration: 'month' },
        { label: 'Last 3 Months', duration: '3m' },
        { label: 'Last 6 Months', duration: '6m' },
        { label: 'This Year', duration: 'year' },
        { label: 'All time', duration: 'all' },
    ];

    const handlePresetSelect = (preset: typeof presets[0]) => {
        const now = new Date();
        let from: Date | null = null;
        let to: Date | null = endOfDay(now);

        switch (preset.duration) {
            case 'week':
                from = startOfWeek(now, { weekStartsOn: 1 });
                to = endOfWeek(now, { weekStartsOn: 1 });
                break;
            case 'month':
                from = startOfMonth(now);
                to = endOfMonth(now);
                break;
            case '3m':
                from = startOfMonth(subMonths(now, 2));
                to = endOfMonth(now);
                break;
            case '6m':
                from = startOfMonth(subMonths(now, 5));
                to = endOfMonth(now);
                break;
            case 'year':
                from = startOfMonth(subMonths(now, 11));
                to = endOfMonth(now);
                break;
            case 'all':
                from = null;
                to = null;
                break;
        }

        if (from) from = startOfDay(from);
        if (to) to = endOfDay(to);

        onChange({
            from,
            to,
            label: preset.label
        });
        setIsOpen(false);
    };

    const handleApplyCustom = () => {
        if (!tempFrom || !tempTo) return;

        const fromDate = parseISO(tempFrom);
        const toDate = parseISO(tempTo);

        if (isValid(fromDate) && isValid(toDate)) {
            onChange({
                from: startOfDay(fromDate),
                to: endOfDay(toDate),
                label: `${format(fromDate, 'MMM d, yyyy')} - ${format(toDate, 'MMM d, yyyy')}`
            });
            setIsOpen(false);
        }
    };

    return (
        <div className="date-range-picker">
            <div className="date-range-trigger" onClick={() => setIsOpen(!isOpen)}>
                <Clock size={16} />
                <span>{value.label}</span>
                <ChevronDown size={14} />
            </div>

            {isOpen && (
                <>
                    <div className="overlay" onClick={() => setIsOpen(false)} />
                    <div className="date-range-popover">
                        <div className="date-range-presets">
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    className={`preset-button ${value.label === preset.label ? 'active' : ''}`}
                                    onClick={() => handlePresetSelect(preset)}
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                        <div className="date-range-custom">
                            <span className="custom-range-label">Custom Range</span>
                            <div className="date-inputs">
                                <div className="date-inp-group">
                                    <label>From</label>
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={tempFrom}
                                        onChange={(e) => setTempFrom(e.target.value)}
                                        max={tempTo}
                                    />
                                </div>
                                <div className="date-inp-group">
                                    <label>To</label>
                                    <input
                                        type="date"
                                        className="date-input"
                                        value={tempTo}
                                        onChange={(e) => setTempTo(e.target.value)}
                                        min={tempFrom}
                                    />
                                </div>
                            </div>
                            <button
                                className="apply-button"
                                onClick={handleApplyCustom}
                                disabled={!tempFrom || !tempTo}
                            >
                                Apply Range
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

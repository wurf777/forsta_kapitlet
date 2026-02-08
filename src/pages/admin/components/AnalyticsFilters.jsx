import React from 'react';
import { Calendar } from 'lucide-react';

const QUICK_RANGES = [
    { label: '7d', days: 7 },
    { label: '30d', days: 30 },
    { label: '90d', days: 90 },
    { label: 'Allt', days: 365 * 5 },
];

const AnalyticsFilters = ({ filters, onChange }) => {
    const setRange = (days) => {
        onChange({
            ...filters,
            from: new Date(Date.now() - days * 86400000).toISOString().split('T')[0],
            to: new Date().toISOString().split('T')[0],
        });
    };

    return (
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200">
            <Calendar size={16} className="text-gray-400" />
            <input
                type="date"
                value={filters.from}
                onChange={(e) => onChange({ ...filters, from: e.target.value })}
                className="px-2 py-1 border border-gray-200 rounded text-sm"
            />
            <span className="text-gray-400 text-sm">till</span>
            <input
                type="date"
                value={filters.to}
                onChange={(e) => onChange({ ...filters, to: e.target.value })}
                className="px-2 py-1 border border-gray-200 rounded text-sm"
            />
            <div className="flex gap-1 ml-2">
                {QUICK_RANGES.map(({ label, days }) => (
                    <button
                        key={label}
                        onClick={() => setRange(days)}
                        className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default AnalyticsFilters;

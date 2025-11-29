import React from 'react';

import { useLanguage } from '../context/LanguageContext';

const ModeSelector = ({ modes, onChange }) => {
    const { t } = useLanguage();
    const handleSliderChange = (key, value) => {
        onChange({ ...modes, [key]: parseInt(value) });
    };

    const toggleChip = (chip) => {
        const currentChips = modes.vibes || [];
        const newChips = currentChips.includes(chip)
            ? currentChips.filter(c => c !== chip)
            : [...currentChips, chip];
        onChange({ ...modes, vibes: newChips });
    };

    const Slider = ({ label, leftLabel, rightLabel, value, onChange }) => (
        <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-stone-700 mb-2">
                <span>{leftLabel}</span>
                <span className="text-stone-400 text-xs uppercase tracking-wider">{label}</span>
                <span>{rightLabel}</span>
            </div>
            <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={value || 3}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-stone-800"
            />
            <div className="flex justify-between text-xs text-stone-400 mt-1 px-1">
                <span>|</span><span>|</span><span>|</span><span>|</span><span>|</span>
            </div>
        </div>
    );

    const Chip = ({ label }) => {
        const isSelected = (modes.vibes || []).includes(label);
        return (
            <button
                onClick={() => toggleChip(label)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${isSelected
                    ? 'bg-stone-800 text-white border-stone-800'
                    : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                    }`}
            >
                {label}
            </button>
        );
    };

    const VIBES = [
        "Mysigt", "Spännande", "Lärorikt", "Sorgligt", "Roligt",
        "Romantiskt", "Obehagligt", "Tänkvärt", "Snabbläst"
    ];

    const getVibeLabel = (vibe) => {
        return t(`modeSelector.vibes.${vibe}`) || vibe;
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 mb-8">
            <h2 className="text-lg font-serif font-bold text-stone-800 mb-4">{t('modeSelector.title')}</h2>

            <div className="space-y-2 mb-8">
                <Slider
                    label={t('modeSelector.length')}
                    leftLabel={t('modeSelector.shortFast')}
                    rightLabel={t('modeSelector.longEpic')}
                    value={modes.length}
                    onChange={(v) => handleSliderChange('length', v)}
                />
                <Slider
                    label={t('modeSelector.mood')}
                    leftLabel={t('modeSelector.lightHopeful')}
                    rightLabel={t('modeSelector.darkHeavy')}
                    value={modes.mood}
                    onChange={(v) => handleSliderChange('mood', v)}
                />
                <Slider
                    label={t('modeSelector.tempo')}
                    leftLabel={t('modeSelector.slowReflective')}
                    rightLabel={t('modeSelector.highAction')}
                    value={modes.tempo}
                    onChange={(v) => handleSliderChange('tempo', v)}
                />
            </div>

            <div>
                <h3 className="text-sm font-medium text-stone-700 mb-3">{t('modeSelector.vibe')}</h3>
                <div className="flex flex-wrap gap-2">
                    {VIBES.map(vibe => (
                        <Chip key={vibe} label={getVibeLabel(vibe)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModeSelector;

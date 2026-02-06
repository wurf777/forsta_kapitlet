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
        <div className="mb-5 md:mb-6">
            <div className="flex justify-between text-xs md:text-sm font-medium text-stone-700 mb-2 gap-2">
                <span className="text-left flex-1 truncate">{leftLabel}</span>
                <span className="text-stone-400 text-[10px] md:text-xs uppercase tracking-wider flex-shrink-0">{label}</span>
                <span className="text-right flex-1 truncate">{rightLabel}</span>
            </div>
            <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={value || 3}
                onChange={(e) => onChange(e.target.value)}
                className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-accent"
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
                className={`px-2.5 md:px-3 py-1 md:py-1.5 rounded-full text-xs md:text-sm font-medium transition-colors border ${isSelected
                    ? 'bg-accent text-white border-accent'
                    : 'bg-bg-card text-stone-600 border-stone-200 hover:border-accent/40'
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
        <div className="card p-4 md:p-6 mb-6 md:mb-8 border-warm/20">
            <h2 className="text-base md:text-lg font-heading text-stone-800 mb-3 md:mb-4">{t('modeSelector.title')}</h2>

            <div className="space-y-2 mb-6 md:mb-8">
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
                <h3 className="text-xs md:text-sm font-medium text-stone-700 mb-3">{t('modeSelector.vibe')}</h3>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {VIBES.map(vibe => (
                        <Chip key={vibe} label={getVibeLabel(vibe)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModeSelector;

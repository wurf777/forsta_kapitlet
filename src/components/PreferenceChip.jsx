import React, { useState, useRef, useEffect } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PREFERENCE_LABELS, PREFERENCE_MAPS } from '../services/gemini';

const PreferenceChip = ({ type, label, currentValue, onConfirm }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [sliderValue, setSliderValue] = useState(currentValue);
    const popoverRef = useRef(null);
    const chipRef = useRef(null);

    const prefLabel = PREFERENCE_LABELS[type];

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target) &&
                chipRef.current && !chipRef.current.contains(e.target)
            ) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    if (!prefLabel) return <span>{label}</span>;

    const handleSave = () => {
        if (sliderValue !== currentValue) {
            onConfirm(type, sliderValue);
        }
        setIsOpen(false);
    };

    return (
        <span className="relative inline-block">
            <button
                ref={chipRef}
                onClick={() => {
                    if (!isOpen) setSliderValue(currentValue);
                    setIsOpen(!isOpen);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/15 text-accent hover:bg-accent/25 rounded-full text-sm font-medium transition-colors cursor-pointer border border-accent/20"
            >
                {label}
                <SlidersHorizontal size={12} className="opacity-60" />
            </button>

            {isOpen && (
                <div
                    ref={popoverRef}
                    className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 w-56"
                >
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 text-center">
                        {prefLabel.name}
                    </div>
                    <div className="text-center text-sm font-semibold text-gray-800 mb-3">
                        {PREFERENCE_MAPS[type]?.[sliderValue] || sliderValue}
                    </div>
                    <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={sliderValue}
                        onChange={(e) => setSliderValue(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-accent"
                    />
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 mb-3">
                        <span>{prefLabel.left}</span>
                        <span>{prefLabel.right}</span>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="flex-1 px-2 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Avbryt
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex-1 px-2 py-1.5 text-xs text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors font-medium"
                        >
                            Spara
                        </button>
                    </div>
                    {/* Arrow pointing down */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-gray-200 transform rotate-45 -mt-1.5"></div>
                </div>
            )}
        </span>
    );
};

export default PreferenceChip;

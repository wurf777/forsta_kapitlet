import React, { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import BookRecommendationsList from '../components/BookRecommendationsList';
import ModeSelector from '../components/ModeSelector';
import { Sparkles } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useBibbi } from '../context/BibbiContext';

const Recommendations = () => {
    const { t } = useLanguage();
    const { setModes, setIsDocked } = useBibbi();
    const [localModes, setLocalModes] = useState({
        length: 3,
        mood: 3,
        tempo: 3,
        vibes: []
    });

    // Dock the chat when on this page
    useEffect(() => {
        setIsDocked(true);
        return () => setIsDocked(false);
    }, [setIsDocked]);

    // Sync modes to global context
    useEffect(() => {
        setModes(localModes);
    }, [localModes, setModes]);

    return (
        <div className="space-y-8" id="top">
            {/* Page header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 text-accent mb-2">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-4xl font-heading text-gray-900">{t('recommendations.title')}</h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {t('recommendations.subtitle')}
                </p>
            </div>

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left column - Book Recommendations */}
                <div className="lg:col-span-5">
                    <BookRecommendationsList />
                </div>

                {/* Right column - Chat Interface */}
                <div className="lg:col-span-7">
                    <div className="lg:sticky lg:top-6">
                        <ModeSelector modes={localModes} onChange={setLocalModes} />
                        <ChatInterface />
                    </div>
                </div>
            </div>

            {/* Feature cards */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h3 className="font-bold text-gray-900 mb-2">{t('recommendations.personal')}</h3>
                    <p className="text-sm text-gray-600">{t('recommendations.personalDesc')}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h3 className="font-bold text-gray-900 mb-2">{t('recommendations.exploratory')}</h3>
                    <p className="text-sm text-gray-600">{t('recommendations.exploratoryDesc')}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 text-center">
                    <h3 className="font-bold text-gray-900 mb-2">{t('recommendations.alwaysReady')}</h3>
                    <p className="text-sm text-gray-600">{t('recommendations.alwaysReadyDesc')}</p>
                </div>
            </div>
        </div>
    );
};

export default Recommendations;

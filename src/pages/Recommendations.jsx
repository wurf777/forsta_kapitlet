import React, { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import BookRecommendationsList from '../components/BookRecommendationsList';
import ModeSelector from '../components/ModeSelector';
import { Sparkles, MessageCircleHeart } from 'lucide-react';

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

    useEffect(() => {
        setIsDocked(true);
        return () => setIsDocked(false);
    }, [setIsDocked]);

    useEffect(() => {
        setModes(localModes);
    }, [localModes, setModes]);

    return (
        <div className="space-y-6 md:space-y-8 fade-in-up" id="top">
            <div className="relative overflow-hidden rounded-3xl border border-warm/20 bg-gradient-to-br from-bg-card via-bg-secondary to-warm-light px-5 py-8 md:px-8 md:py-10 text-center shadow-md">
                <div className="absolute -top-14 -right-12 h-40 w-40 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-warm/25 blur-2xl" aria-hidden="true" />

                <div className="relative space-y-3 md:space-y-4">
                    <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-warm/20 text-warm-dark mb-2">
                        <MessageCircleHeart size={28} className="md:w-8 md:h-8" />
                    </div>
                    <h1 className="text-2xl md:text-3xl lg:text-5xl font-heading text-gray-900">{t('recommendations.title')}</h1>
                    <p className="text-base md:text-lg lg:text-xl text-stone-700 max-w-3xl mx-auto">
                        {t('recommendations.subtitle')}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
                <div className="lg:col-span-5">
                    <BookRecommendationsList />
                </div>

                <div className="lg:col-span-7">
                    <div className="lg:sticky lg:top-6">
                        <ModeSelector modes={localModes} onChange={setLocalModes} />
                        <ChatInterface />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 mt-8 md:mt-12">
                <div className="card p-5 md:p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-accent/10 text-accent mx-auto mb-3 flex items-center justify-center">
                        <Sparkles size={18} />
                    </div>
                    <h3 className="font-heading text-xl text-gray-900 mb-2">{t('recommendations.personal')}</h3>
                    <p className="text-sm text-stone-600">{t('recommendations.personalDesc')}</p>
                </div>
                <div className="card p-5 md:p-6 text-center">
                    <div className="w-10 h-10 rounded-full bg-warm/20 text-warm-dark mx-auto mb-3 flex items-center justify-center">
                        <Sparkles size={18} />
                    </div>
                    <h3 className="font-heading text-xl text-gray-900 mb-2">{t('recommendations.exploratory')}</h3>
                    <p className="text-sm text-stone-600">{t('recommendations.exploratoryDesc')}</p>
                </div>
                <div className="card p-5 md:p-6 text-center sm:col-span-2 md:col-span-1">
                    <div className="w-10 h-10 rounded-full bg-highlight/20 text-highlight mx-auto mb-3 flex items-center justify-center">
                        <Sparkles size={18} />
                    </div>
                    <h3 className="font-heading text-xl text-gray-900 mb-2">{t('recommendations.alwaysReady')}</h3>
                    <p className="text-sm text-stone-600">{t('recommendations.alwaysReadyDesc')}</p>
                </div>
            </div>
        </div>
    );
};

export default Recommendations;

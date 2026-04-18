import React, { useState, useEffect } from 'react';
import ChatInterface from '../components/ChatInterface';
import BookRecommendationsList from '../components/BookRecommendationsList';
import ModeSelector from '../components/ModeSelector';
import { Sparkles, MessageCircleHeart, Dices, RefreshCw } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useBibbi } from '../context/BibbiContext';
import { getSurpriseRecommendation } from '../services/gemini';
import { getUserProfile } from '../services/storage';

const Recommendations = () => {
    const { t } = useLanguage();
    const { setModes, setIsDocked } = useBibbi();
    const [localModes, setLocalModes] = useState({
        length: 3,
        mood: 3,
        tempo: 3,
        vibes: []
    });
    const [surpriseBook, setSurpriseBook] = useState(null);
    const [surpriseLoading, setSurpriseLoading] = useState(false);
    const [surpriseError, setSurpriseError] = useState(null);

    const handleSurprise = async () => {
        setSurpriseLoading(true);
        setSurpriseError(null);
        try {
            const profile = getUserProfile();
            const result = await getSurpriseRecommendation(null, profile);
            setSurpriseBook(result);
        } catch (err) {
            setSurpriseError(err?.message === 'no_api_key' ? t('recommendations.errorNoApiKey') : t('recommendations.errorWildcard'));
        } finally {
            setSurpriseLoading(false);
        }
    };

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

            <section className="card p-5 md:p-6 border-warm/20 bg-gradient-to-br from-bg-card to-bg-secondary/70">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={18} className="text-accent" />
                    <h2 className="font-heading text-xl text-gray-900">{t('guides.recommendations.title')}</h2>
                </div>
                <p className="text-sm text-stone-600 mb-4">{t('guides.recommendations.subtitle')}</p>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white/70 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-full bg-warm/20 text-warm-dark flex items-center justify-center">
                                <MessageCircleHeart size={18} />
                            </div>
                            <h3 className="font-heading text-lg text-gray-900">{t('guides.recommendations.chatTitle')}</h3>
                        </div>
                        <ol className="space-y-2 text-sm text-stone-700">
                            <li className="flex gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">1</span>
                                <span>{t('guides.recommendations.chatStep1')}</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">2</span>
                                <span>{t('guides.recommendations.chatStep2')}</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">3</span>
                                <span>{t('guides.recommendations.chatStep3')}</span>
                            </li>
                        </ol>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white/70 p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-9 h-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                                <Sparkles size={18} />
                            </div>
                            <h3 className="font-heading text-lg text-gray-900">{t('guides.recommendations.uiTitle')}</h3>
                        </div>
                        <ol className="space-y-2 text-sm text-stone-700">
                            <li className="flex gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">1</span>
                                <span>{t('guides.recommendations.uiStep1')}</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">2</span>
                                <span>{t('guides.recommendations.uiStep2')}</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="w-6 h-6 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">3</span>
                                <span>{t('guides.recommendations.uiStep3')}</span>
                            </li>
                        </ol>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
                <div className="lg:col-span-5 space-y-5">
                    <BookRecommendationsList />

                    {/* Kasta tärningen */}
                    <div className="card p-5 border-dashed border-2 border-accent/20 bg-gradient-to-br from-bg-card to-bg-secondary/50">
                        <div className="flex items-center gap-2 mb-1">
                            <Dices size={18} className="text-accent" />
                            <h3 className="font-heading text-lg text-gray-900">{t('surprise.title')}</h3>
                        </div>
                        <p className="text-sm text-stone-500 mb-4">{t('surprise.intro')}</p>

                        {!surpriseBook && !surpriseLoading && (
                            <button
                                onClick={handleSurprise}
                                className="btn btn-primary w-full flex items-center justify-center gap-2"
                            >
                                <Dices size={18} />
                                {t('surprise.button')}
                            </button>
                        )}

                        {surpriseLoading && (
                            <div className="flex items-center justify-center gap-2 py-4 text-accent text-sm">
                                <RefreshCw size={16} className="animate-spin" />
                                {t('surprise.loading')}
                            </div>
                        )}

                        {surpriseError && (
                            <p className="text-red-500 text-sm text-center py-2">{surpriseError}</p>
                        )}

                        {surpriseBook && !surpriseLoading && (
                            <div className="space-y-3">
                                <div className="rounded-xl border border-accent/20 bg-white/70 p-4">
                                    <span className="inline-block text-xs font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-full mb-2">
                                        🎲 {t('surprise.label')}
                                    </span>
                                    <h4 className="font-heading text-base text-gray-900">{surpriseBook.title}</h4>
                                    <p className="text-sm text-stone-600 mb-1">{surpriseBook.author}</p>
                                    {surpriseBook.genre_specifics && (
                                        <p className="text-xs text-stone-400 mb-2">{surpriseBook.genre_specifics}</p>
                                    )}
                                    <p className="text-sm text-stone-700 italic">{surpriseBook.reason}</p>
                                </div>
                                <button
                                    onClick={handleSurprise}
                                    className="btn btn-secondary w-full flex items-center justify-center gap-2 text-sm"
                                >
                                    <Dices size={16} />
                                    {t('surprise.tryAgain')}
                                </button>
                            </div>
                        )}
                    </div>
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

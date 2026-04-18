import React, { useState, useEffect } from 'react';
import { ArrowRight, Book, Star, Sparkles, TrendingUp, BookOpen, Clock, Lightbulb, LogIn, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLibrary, getUserProfile } from '../services/storage';
import { getDailyTip, NoApiKeyError } from '../services/gemini';
import { searchBooks } from '../services/googleBooks';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/useAuth';
import AuthModal from '../components/AuthModal';

const getStatusClass = (status) => {
    if (status === 'Läst') return 'status-badge-read';
    if (status === 'Läser') return 'status-badge-reading';
    return 'status-badge-queued';
};

const formatActivityDate = (timestamp, language) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(language === 'sv' ? 'sv-SE' : 'en-US', {
        day: 'numeric',
        month: 'short'
    }).format(date);
};

const Home = () => {
    const { t, language } = useLanguage();
    const { isAuthenticated, user } = useAuth();
    const [currentlyReading, setCurrentlyReading] = useState([]);
    const [wantToRead, setWantToRead] = useState([]);
    const [stats, setStats] = useState({ total: 0, read: 0, reading: 0, wantToRead: 0, avgRating: 0, topGenres: [] });
    const [recentActivity, setRecentActivity] = useState([]);
    const [dailyTip, setDailyTip] = useState(null);
    const [tipBook, setTipBook] = useState(null);
    const [tipLoading, setTipLoading] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authModalMode, setAuthModalMode] = useState('login');
    const [showKeyGuide, setShowKeyGuide] = useState(false);
    const [tipNoApiKey, setTipNoApiKey] = useState(false);

    const openLogin = () => { setAuthModalMode('login'); setShowAuthModal(true); };
    const openRegister = () => { setAuthModalMode('register'); setShowAuthModal(true); };

    const firstName = user?.name?.trim()?.split(' ')[0] || user?.email?.split('@')[0] || t('home.bookLover');

    useEffect(() => {
        if (isAuthenticated) {
            const loadData = async () => {
                const library = await getLibrary();
                const profile = getUserProfile();

                const reading = library.filter(book => book.status === 'Läser');
                setCurrentlyReading(reading);

                const toRead = library.filter(book => book.status === 'Vill läsa');
                setWantToRead(toRead);

                const readBooks = library.filter(book => book.status === 'Läst');
                const ratedBooks = library.filter(book => book.rating > 0);
                const avgRating = ratedBooks.length > 0
                    ? (ratedBooks.reduce((sum, book) => sum + book.rating, 0) / ratedBooks.length).toFixed(1)
                    : 0;

                const genreCount = {};
                library.forEach(book => {
                    (book.categories || []).forEach(genre => {
                        genreCount[genre] = (genreCount[genre] || 0) + 1;
                    });
                });
                const topGenres = Object.entries(genreCount)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([genre]) => genre);

                setStats({
                    total: library.length,
                    read: readBooks.length,
                    reading: reading.length,
                    wantToRead: toRead.length,
                    avgRating: parseFloat(avgRating),
                    topGenres
                });

                const sortedByUpdate = [...library]
                    .sort((a, b) => {
                        const dateA = new Date(a.updatedAt || a.addedAt || 0);
                        const dateB = new Date(b.updatedAt || b.addedAt || 0);
                        return dateB - dateA;
                    })
                    .slice(0, 5);
                setRecentActivity(sortedByUpdate);

                if (library.length > 0) {
                    setTipLoading(true);
                    try {
                        const tipResult = await getDailyTip(profile);
                        setDailyTip(tipResult);

                        if (tipResult?.title) {
                            if (tipResult._book) {
                                setTipBook(tipResult._book);
                            } else {
                                try {
                                    const results = await searchBooks(`${tipResult.title} ${tipResult.author}`);
                                    if (results.length > 0) {
                                        setTipBook(results[0]);
                                        cacheTipBook(results[0]);
                                    }
                                } catch (err) {
                                    console.error('Failed to look up tip book:', err);
                                }
                            }
                        }
                    } catch (err) {
                        if (err instanceof NoApiKeyError) {
                            setTipNoApiKey(true);
                        } else {
                            console.error('Failed to load daily tip:', err);
                        }
                    } finally {
                        setTipLoading(false);
                    }
                } else {
                    setDailyTip(null);
                    setTipBook(null);
                }
            };
            loadData();
        }
    }, [isAuthenticated]);

    const cacheTipBook = (book) => {
        try {
            const cached = localStorage.getItem('forsta_kapitlet_daily_tip');
            if (cached) {
                const data = JSON.parse(cached);
                data.tip._book = book;
                localStorage.setItem('forsta_kapitlet_daily_tip', JSON.stringify(data));
            }
        } catch {
            // Ignore cache errors
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="space-y-12 md:space-y-16 fade-in-up">
                {/* Hero */}
                <section className="relative overflow-hidden rounded-3xl border border-warm/20 bg-gradient-to-br from-bg-card via-bg-secondary to-warm-light px-6 py-12 md:py-16 text-center shadow-lg">
                    <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />
                    <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-warm/20 blur-2xl" aria-hidden="true" />

                    <div className="relative space-y-6 md:space-y-8">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-heading text-gray-900 leading-tight">
                            {t('home.heroTitle')} <span className="text-accent">{t('home.heroTitleHighlight')}</span>
                        </h1>
                        <p className="text-lg md:text-xl text-stone-700 max-w-2xl mx-auto leading-relaxed">
                            {t('home.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 md:pt-8">
                            <button
                                onClick={openRegister}
                                className="btn btn-primary text-base md:text-lg px-6 md:px-8 py-2.5 md:py-3 inline-flex items-center justify-center gap-2"
                            >
                                {t('auth.register')}
                            </button>
                            <button
                                onClick={openLogin}
                                className="btn btn-secondary text-base md:text-lg px-6 md:px-8 py-2.5 md:py-3 inline-flex items-center justify-center gap-2"
                            >
                                <LogIn size={20} />
                                {t('auth.login')}
                            </button>
                        </div>
                    </div>
                </section>

                {/* Feature cards */}
                <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 text-center max-w-5xl mx-auto px-4">
                    <div className="card p-5 md:p-6">
                        <div className="w-12 h-12 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                            <Book size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{t('home.featureCards.saveTitle')}</h3>
                        <p className="text-stone-600 text-sm md:text-base">{t('home.featureCards.saveBody')}</p>
                    </div>
                    <div className="card p-5 md:p-6">
                        <div className="w-12 h-12 bg-warm/20 rounded-full flex items-center justify-center mx-auto mb-4 text-warm-dark">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{t('home.featureCards.aiTitle')}</h3>
                        <p className="text-stone-600 text-sm md:text-base">{t('home.featureCards.aiBody')}</p>
                    </div>
                    <div className="card p-5 md:p-6 sm:col-span-2 md:col-span-1">
                        <div className="w-12 h-12 bg-highlight/20 rounded-full flex items-center justify-center mx-auto mb-4 text-highlight">
                            <Star size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{t('home.featureCards.rateTitle')}</h3>
                        <p className="text-stone-600 text-sm md:text-base">{t('home.featureCards.rateBody')}</p>
                    </div>
                </section>

                {/* Onboarding guide – how to get started */}
                <section className="max-w-3xl mx-auto px-4">
                    <h2 className="text-2xl md:text-3xl font-heading text-gray-900 text-center mb-8">
                        {t('onboarding.howToStart')}
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                        {[
                            { icon: <Key size={26} />, title: t('onboarding.step1Title'), body: t('onboarding.step1Body'), color: 'bg-accent/10 text-accent' },
                            { icon: <Book size={26} />, title: t('onboarding.step2Title'), body: t('onboarding.step2Body'), color: 'bg-warm/20 text-warm-dark' },
                            { icon: <Sparkles size={26} />, title: t('onboarding.step3Title'), body: t('onboarding.step3Body'), color: 'bg-highlight/20 text-highlight' },
                        ].map((step, i) => (
                            <div key={i} className="card p-5 text-center">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${step.color}`}>
                                    {step.icon}
                                </div>
                                <div className="w-6 h-6 rounded-full bg-stone-200 text-stone-600 text-xs font-bold flex items-center justify-center mx-auto mb-2">{i + 1}</div>
                                <h3 className="font-bold text-gray-900 mb-1 text-sm md:text-base">{step.title}</h3>
                                <p className="text-stone-600 text-sm">{step.body}</p>
                            </div>
                        ))}
                    </div>

                    {/* Important notice box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
                        <div className="flex gap-3">
                            <Key size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-amber-900 mb-1">{t('onboarding.whyNeeded')}</p>
                                <p className="text-sm text-amber-800">{t('onboarding.whyNeededAnswer')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Collapsible step-by-step key guide */}
                    <div className="card p-5">
                        <button
                            onClick={() => setShowKeyGuide(g => !g)}
                            className="w-full flex items-center justify-between gap-2 text-left"
                        >
                            <span className="font-semibold text-gray-900 flex items-center gap-2">
                                <Key size={18} className="text-accent" />
                                {t('onboarding.keyGuideTitle')}
                            </span>
                            {showKeyGuide ? <ChevronUp size={18} className="text-stone-500 flex-shrink-0" /> : <ChevronDown size={18} className="text-stone-500 flex-shrink-0" />}
                        </button>

                        {showKeyGuide && (
                            <div className="mt-4 space-y-2 text-sm text-stone-700">
                                <p className="text-stone-600 mb-3">{t('onboarding.keyGuideIntro')}</p>
                                {[
                                    t('onboarding.keyGuideStep1'),
                                    t('onboarding.keyGuideStep2'),
                                    t('onboarding.keyGuideStep3'),
                                    t('onboarding.keyGuideStep4'),
                                    t('onboarding.keyGuideStep5'),
                                    t('onboarding.keyGuideStep6'),
                                ].map((step, i) => (
                                    <div key={i} className="flex gap-3 p-2 rounded-lg hover:bg-stone-50">
                                        <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                                <p className="text-stone-500 italic text-xs pt-2 border-t border-stone-100">{t('onboarding.keyGuideNote')}</p>
                            </div>
                        )}
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={openRegister}
                            className="btn btn-primary text-lg px-8 py-3"
                        >
                            {t('auth.register')}
                        </button>
                    </div>
                </section>

                <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} initialMode={authModalMode} />
            </div>
        );
    }

    return (
        <div className="space-y-8 md:space-y-10 fade-in-up">
            <section className="relative overflow-hidden rounded-3xl border border-warm/20 bg-gradient-to-br from-bg-card via-bg-secondary to-warm-light px-6 py-8 md:px-10 md:py-10 shadow-lg">
                <div className="absolute -top-16 -right-10 h-44 w-44 rounded-full bg-accent/10 blur-2xl" aria-hidden="true" />
                <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-warm/25 blur-2xl" aria-hidden="true" />

                <div className="relative space-y-4 text-center md:text-left">
                    <p className="text-xs md:text-sm uppercase tracking-[0.2em] text-warm-dark font-semibold">
                        {t('home.welcomeBack')}, {firstName}
                    </p>
                    <h1 className="text-2xl md:text-4xl lg:text-5xl font-heading text-gray-900">
                        {t('home.heroTitle')} <span className="text-accent">{t('home.heroTitleHighlight')}</span>
                    </h1>
                    <p className="text-sm md:text-lg text-stone-700 max-w-3xl">
                        {t('home.heroPersonalSubtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 justify-center md:justify-start">
                        <Link to="/recommendations" className="btn btn-primary px-5 md:px-6 py-2.5">
                            {t('home.getRecommendations')}
                        </Link>
                        <Link to="/books" className="btn btn-secondary px-5 md:px-6 py-2.5">
                            {t('home.myLibrary')}
                        </Link>
                    </div>
                </div>
            </section>

            {(dailyTip || tipLoading || tipNoApiKey) && (
                <section className="space-y-3">
                    <h2 className="text-xl font-heading flex items-center gap-2">
                        <Lightbulb size={20} className="text-warm-dark" />
                        {t('home.bibbiTip')}
                    </h2>

                    {tipNoApiKey ? (
                        <div className="card bg-gradient-to-br from-bg-card to-warm-light border-warm/25">
                            <div className="flex gap-3 items-start">
                                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                                    B
                                </div>
                                <div>
                                    <p className="text-sm text-stone-700">{t('recommendations.errorNoApiKey')}</p>
                                    <Link to="/profile#api-key" className="text-accent text-sm hover:underline mt-1 inline-flex items-center gap-1">
                                        <Key size={12} /> {t('apiKey.title')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : tipLoading ? (
                        <div className="card bg-gradient-to-br from-bg-card to-warm-light border-warm/25 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-16 h-24 bg-warm/25 rounded-xl flex-shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-warm/25 rounded w-3/4" />
                                    <div className="h-3 bg-warm/20 rounded w-1/2" />
                                    <div className="h-3 bg-warm/20 rounded w-full" />
                                </div>
                            </div>
                        </div>
                    ) : dailyTip && (
                        <div className="card bg-gradient-to-br from-bg-card to-warm-light border-warm/25">
                            <div className="flex gap-4">
                                {tipBook?.cover ? (
                                    <Link to={tipBook.dbId ? `/book/${tipBook.dbId}` : `/books?q=${encodeURIComponent(dailyTip.title)}`} className="w-16 h-24 bg-stone-200 rounded-lg flex-shrink-0 overflow-hidden book-tilt">
                                        <img src={tipBook.cover} alt={dailyTip.title} className="w-full h-full object-cover" />
                                    </Link>
                                ) : (
                                    <div className="w-12 h-12 bg-warm/20 rounded-full flex-shrink-0 flex items-center justify-center mt-1">
                                        <Sparkles size={22} className="text-warm-dark" />
                                    </div>
                                )}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-semibold">
                                            B
                                        </div>
                                        <p className="text-sm text-stone-600 italic">{t('home.bibbiGreeting')}</p>
                                    </div>
                                    <p className="font-heading text-xl text-gray-900 leading-tight">
                                        <Link to={tipBook?.dbId ? `/book/${tipBook.dbId}` : `/books?q=${encodeURIComponent(dailyTip.title)}`} className="hover:text-accent transition-colors">
                                            {dailyTip.title}
                                        </Link>
                                    </p>
                                    <p className="text-sm text-stone-700">av {dailyTip.author}</p>
                                    <p className="text-sm text-stone-700 mt-2 italic">{dailyTip.reason}</p>
                                    <Link to="/recommendations#top" className="text-accent text-sm hover:underline mt-3 inline-flex items-center gap-1">
                                        {t('home.moreTips')} <ArrowRight size={12} />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {stats.total > 0 && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div className="card text-center py-4 md:py-5 px-3">
                        <div className="flex items-center justify-center gap-2 text-accent mb-1">
                            <Book size={16} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <p className="text-2xl md:text-4xl font-heading text-gray-900">{stats.total}</p>
                        <p className="text-xs md:text-sm text-stone-600">{t('home.stats.totalBooks')}</p>
                    </div>
                    <div className="card text-center py-4 md:py-5 px-3">
                        <div className="flex items-center justify-center gap-2 text-warm-dark mb-1">
                            <TrendingUp size={16} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <p className="text-2xl md:text-4xl font-heading text-gray-900">{stats.read}</p>
                        <p className="text-xs md:text-sm text-stone-600">{t('home.stats.booksRead')}</p>
                    </div>
                    <div className="card text-center py-4 md:py-5 px-3">
                        <div className="flex items-center justify-center gap-2 text-highlight mb-1">
                            <Star size={16} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <p className="text-2xl md:text-4xl font-heading text-gray-900">{stats.avgRating || '-'}</p>
                        <p className="text-xs md:text-sm text-stone-600">{t('home.stats.avgRating')}</p>
                    </div>
                    <div className="card text-center py-4 md:py-5 px-3">
                        <div className="flex items-center justify-center gap-2 text-accent-dark mb-1">
                            <BookOpen size={16} className="md:w-[18px] md:h-[18px]" />
                        </div>
                        <p className="text-2xl md:text-4xl font-heading text-gray-900">{stats.reading}</p>
                        <p className="text-xs md:text-sm text-stone-600">{t('home.stats.currentlyReading')}</p>
                    </div>
                </section>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-heading flex items-center gap-2">
                            <BookOpen size={20} className="text-accent" />
                            {t('home.readingNow')}
                        </h2>
                        <Link to="/books?filter=Läser" className="text-accent hover:underline text-sm flex items-center gap-1">
                            {t('home.seeAll')} <ArrowRight size={14} />
                        </Link>
                    </div>

                    {currentlyReading.length > 0 ? (
                        <div className="space-y-3">
                            {currentlyReading.slice(0, 2).map((book) => (
                                <Link to={`/book/${book.id}`} key={book.id} className="card flex gap-4 hover:no-underline">
                                    <div className="w-16 h-24 bg-stone-200 rounded-lg flex-shrink-0 overflow-hidden book-tilt">
                                        {book.cover ? (
                                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-400 bg-stone-100">
                                                <Book size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <h3 className="font-heading text-xl text-gray-900 truncate mb-0">{book.title}</h3>
                                        <p className="text-sm text-stone-600 truncate">{book.author}</p>
                                        {book.progress > 0 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-stone-200 rounded-full h-1.5">
                                                    <div className="bg-accent h-1.5 rounded-full" style={{ width: `${book.progress}%` }} />
                                                </div>
                                                <p className="text-xs text-stone-500 mt-1">{book.progress}% {t('home.progress')}</p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-8 bg-gradient-to-br from-bg-card to-warm-light/80 border-warm/25">
                            <div className="w-14 h-14 rounded-full bg-warm/20 text-warm-dark mx-auto mb-3 flex items-center justify-center">
                                <BookOpen size={28} />
                            </div>
                            <p className="text-base font-heading text-gray-900 mb-1">{t('home.noCurrentlyReading')}</p>
                            <p className="text-sm text-stone-600 mb-4">{t('home.readingNudge')}</p>
                            <Link to="/recommendations" className="btn btn-secondary px-4 py-2 text-sm">
                                {t('home.findRecommendation')}
                            </Link>
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-heading flex items-center gap-2">
                            <Clock size={20} className="text-accent" />
                            {t('home.wantToReadTitle')}
                        </h2>
                        <Link to="/books?filter=Vill läsa" className="text-accent hover:underline text-sm flex items-center gap-1">
                            {t('home.seeAll')} <ArrowRight size={14} />
                        </Link>
                    </div>

                    {wantToRead.length > 0 ? (
                        <div className="space-y-3">
                            {wantToRead.slice(0, 3).map((book) => (
                                <Link to={`/book/${book.id}`} key={book.id} className="card flex gap-4 hover:no-underline">
                                    <div className="w-16 h-24 bg-stone-200 rounded-lg flex-shrink-0 overflow-hidden book-tilt">
                                        {book.cover ? (
                                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                <Book size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <h3 className="font-heading text-xl text-gray-900 truncate mb-0">{book.title}</h3>
                                        <p className="text-sm text-stone-600 truncate">{book.author}</p>
                                        {book.categories?.[0] && (
                                            <span className="text-xs text-warm-dark mt-1">{book.categories[0]}</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-8 text-stone-600 bg-bg-card/90">
                            <Clock size={32} className="mx-auto mb-2 opacity-60" />
                            <p className="text-sm">{t('home.noWantToRead')}</p>
                        </div>
                    )}
                </section>
            </div>

            {recentActivity.length > 0 && (
                <section>
                    <h2 className="text-xl font-heading flex items-center gap-2 mb-4">
                        <Clock size={20} className="text-accent" />
                        {t('home.recentActivity')}
                    </h2>

                    <div className="card p-5 md:p-6">
                        <div className="space-y-4">
                            {recentActivity.map((book, index) => (
                                <Link
                                    to={`/book/${book.id}`}
                                    key={book.id}
                                    className="group flex gap-3 hover:no-underline"
                                >
                                    <div className="flex flex-col items-center pt-1">
                                        <span className="w-3 h-3 rounded-full bg-warm border-2 border-bg-card" />
                                        {index < recentActivity.length - 1 && (
                                            <span className="w-px flex-1 bg-stone-200 mt-1.5" />
                                        )}
                                    </div>

                                    <div className="flex-1 rounded-xl border border-stone-200 bg-bg-secondary/60 p-3 transition-colors group-hover:bg-bg-card">
                                        <div className="flex gap-3">
                                            <div className="w-10 h-14 bg-stone-200 rounded flex-shrink-0 overflow-hidden">
                                                {book.cover ? (
                                                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-stone-400">
                                                        <Book size={14} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 truncate text-sm">{book.title}</p>
                                                        <p className="text-xs text-stone-600 truncate">{book.author}</p>
                                                    </div>
                                                    <span className={`status-badge ${getStatusClass(book.status)}`}>
                                                        {t(`status.${book.status}`) || book.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-stone-500 mt-2">
                                                    {t('home.updatedLabel')} {formatActivityDate(book.updatedAt || book.addedAt, language)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {stats.total === 0 && (
                <section className="text-center py-10 md:py-12 bg-gradient-to-br from-bg-card to-bg-secondary rounded-2xl border border-warm/25 px-4">
                    <Book size={40} className="mx-auto text-warm mb-4 md:w-12 md:h-12" />
                    <h3 className="text-xl md:text-2xl font-heading text-gray-900 mb-2">{t('home.startJourney')}</h3>
                    <p className="text-sm md:text-base text-stone-600 mb-6 max-w-lg mx-auto">
                        {t('home.emptyLibrary')}
                    </p>
                    <Link to="/books" className="btn btn-primary">
                        {t('home.addBooks')}
                    </Link>
                </section>
            )}
        </div>
    );
};

export default Home;

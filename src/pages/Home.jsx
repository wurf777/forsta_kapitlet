import React, { useState, useEffect } from 'react';
import { ArrowRight, Book, Star, Sparkles, TrendingUp, BookOpen, Clock, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLibrary, getUserProfile } from '../services/storage';
import { getDailyTip } from '../services/gemini';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const Home = () => {
    const { t } = useLanguage();
    const { isAuthenticated } = useAuth();
    const [currentlyReading, setCurrentlyReading] = useState([]);
    const [wantToRead, setWantToRead] = useState([]);
    const [stats, setStats] = useState({ total: 0, read: 0, reading: 0, wantToRead: 0, avgRating: 0, topGenres: [] });
    const [recentActivity, setRecentActivity] = useState([]);
    const [dailyTip, setDailyTip] = useState(null);
    const [tipLoading, setTipLoading] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            const loadData = async () => {
                const library = await getLibrary();
                const profile = getUserProfile();

                // Currently reading
                const reading = library.filter(book => book.status === 'Läser');
                setCurrentlyReading(reading);

                // Want to read
                const toRead = library.filter(book => book.status === 'Vill läsa');
                setWantToRead(toRead);

                // Calculate stats
                const readBooks = library.filter(book => book.status === 'Läst');
                const ratedBooks = library.filter(book => book.rating > 0);
                const avgRating = ratedBooks.length > 0
                    ? (ratedBooks.reduce((sum, book) => sum + book.rating, 0) / ratedBooks.length).toFixed(1)
                    : 0;

                // Top genres
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

                // Recent activity (last 5 updated books)
                const sortedByUpdate = [...library].sort((a, b) => {
                    const dateA = new Date(b.updatedAt || b.addedAt || 0);
                    const dateB = new Date(a.updatedAt || a.addedAt || 0);
                    return dateA - dateB;
                }).slice(0, 5);
                setRecentActivity(sortedByUpdate);

                // Load daily tip (only if we have books)
                if (library.length > 0) {
                    setTipLoading(true);
                    try {
                        const tip = await getDailyTip(profile);
                        setDailyTip(tip);
                    } catch (err) {
                        console.error('Failed to load daily tip:', err);
                    } finally {
                        setTipLoading(false);
                    }
                }
            };
            loadData();
        }
    }, [isAuthenticated]);

    // Guest View (Landing Page)
    if (!isAuthenticated) {
        return (
            <div className="space-y-16">
                <section className="text-center py-20 space-y-8">
                    <h1 className="text-6xl font-heading text-gray-900 leading-tight">
                        {t('home.heroTitle')} <span className="text-accent">{t('home.heroTitleHighlight')}</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        {t('home.subtitle')}
                    </p>
                    <div className="flex justify-center gap-4 pt-8">
                        <Link
                            to="/beta-signup"
                            className="btn btn-primary text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all"
                        >
                            Kom igång
                        </Link>
                    </div>
                </section>

                <section className="grid md:grid-cols-3 gap-8 text-center max-w-5xl mx-auto px-4">
                    <div className="p-6 bg-white rounded-xl shadow-md">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                            <Book size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Spara dina böcker</h3>
                        <p className="text-gray-600">Samla allt du läser, vill läsa och har läst på ett ställe.</p>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-md">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                            <Sparkles size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">AI-rekommendationer</h3>
                        <p className="text-gray-600">Få personliga boktips från vår AI-bibliotekarie Bibbi.</p>
                    </div>
                    <div className="p-6 bg-white rounded-xl shadow-md">
                        <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4 text-accent">
                            <Star size={24} />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Betygsätt & Recensera</h3>
                        <p className="text-gray-600">Sätt betyg och skriv egna anteckningar om dina läsupplevelser.</p>
                    </div>
                </section>
            </div>
        );
    }

    // Authenticated User View (Dashboard)
    return (
        <div className="space-y-10">
            {/* Hero Section - Compact */}
            <section className="text-center py-8 space-y-4">
                <h1 className="text-4xl font-heading text-gray-900">
                    {t('home.heroTitle')} <span className="text-accent">{t('home.heroTitleHighlight')}</span>
                </h1>
                <div className="flex justify-center gap-4 pt-2">
                    <Link to="/recommendations" className="btn btn-primary px-6 py-2">
                        {t('home.getRecommendations')}
                    </Link>
                    <Link to="/books" className="btn btn-secondary px-6 py-2">
                        {t('home.myLibrary')}
                    </Link>
                </div>
            </section>

            {/* Stats Overview */}
            {stats.total > 0 && (
                <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="card text-center py-4">
                        <div className="flex items-center justify-center gap-2 text-accent mb-1">
                            <Book size={18} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                        <p className="text-sm text-gray-500">{t('home.stats.totalBooks')}</p>
                    </div>
                    <div className="card text-center py-4">
                        <div className="flex items-center justify-center gap-2 text-green-500 mb-1">
                            <TrendingUp size={18} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.read}</p>
                        <p className="text-sm text-gray-500">{t('home.stats.booksRead')}</p>
                    </div>
                    <div className="card text-center py-4">
                        <div className="flex items-center justify-center gap-2 text-yellow-500 mb-1">
                            <Star size={18} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.avgRating || '-'}</p>
                        <p className="text-sm text-gray-500">{t('home.stats.avgRating')}</p>
                    </div>
                    <div className="card text-center py-4">
                        <div className="flex items-center justify-center gap-2 text-blue-500 mb-1">
                            <BookOpen size={18} />
                        </div>
                        <p className="text-3xl font-bold text-gray-900">{stats.reading}</p>
                        <p className="text-sm text-gray-500">{t('home.stats.currentlyReading')}</p>
                    </div>
                </section>
            )}

            {/* Two column layout for main content */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Currently Reading */}
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
                                <Link to={`/book/${book.id}`} key={book.id} className="card flex gap-4 hover:no-underline hover:shadow-md transition-shadow">
                                    <div className="w-16 h-24 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                                        {book.cover ? (
                                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Book size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
                                        <p className="text-sm text-gray-600 truncate">{book.author}</p>
                                        {book.progress > 0 && (
                                            <div className="mt-2">
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div className="bg-accent h-1.5 rounded-full" style={{ width: `${book.progress}%` }}></div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{book.progress}% {t('home.progress')}</p>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-8 text-gray-500">
                            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{t('home.noCurrentlyReading')}</p>
                        </div>
                    )}
                </section>

                {/* Want to Read */}
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
                                <Link to={`/book/${book.id}`} key={book.id} className="card flex gap-4 hover:no-underline hover:shadow-md transition-shadow">
                                    <div className="w-16 h-24 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                                        {book.cover ? (
                                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Book size={20} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
                                        <p className="text-sm text-gray-600 truncate">{book.author}</p>
                                        {book.categories?.[0] && (
                                            <span className="text-xs text-accent mt-1">{book.categories[0]}</span>
                                        )}
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center py-8 text-gray-500">
                            <Clock size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">{t('home.noWantToRead')}</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Bibbi's Daily Tip */}
            {(dailyTip || tipLoading) && (
                <section>
                    <h2 className="text-xl font-heading flex items-center gap-2 mb-4">
                        <Lightbulb size={20} className="text-accent" />
                        {t('home.bibbiTip')}
                    </h2>

                    {tipLoading ? (
                        <div className="card bg-accent/5 border-accent/20 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-accent/20 rounded-full flex-shrink-0"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-accent/20 rounded w-3/4"></div>
                                    <div className="h-3 bg-accent/20 rounded w-1/2"></div>
                                    <div className="h-3 bg-accent/20 rounded w-full"></div>
                                </div>
                            </div>
                        </div>
                    ) : dailyTip && (
                        <div className="card bg-accent/5 border-accent/20">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-accent/20 rounded-full flex-shrink-0 flex items-center justify-center">
                                    <Sparkles size={24} className="text-accent" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-gray-900">
                                        {dailyTip.title} <span className="font-normal text-gray-600">av {dailyTip.author}</span>
                                    </p>
                                    <p className="text-sm text-gray-600 mt-1">{dailyTip.reason}</p>
                                    <Link to="/recommendations" className="text-accent text-sm hover:underline mt-2 inline-block">
                                        {t('home.moreTips')} <ArrowRight size={12} className="inline" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
                <section>
                    <h2 className="text-xl font-heading flex items-center gap-2 mb-4">
                        <Clock size={20} className="text-accent" />
                        {t('home.recentActivity')}
                    </h2>

                    <div className="card">
                        <div className="divide-y divide-gray-100">
                            {recentActivity.map((book) => (
                                <Link to={`/book/${book.id}`} key={book.id} className="flex items-center gap-3 py-3 hover:bg-gray-50 -mx-4 px-4 first:pt-0 last:pb-0 hover:no-underline">
                                    <div className="w-10 h-14 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                                        {book.cover ? (
                                            <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                <Book size={14} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate text-sm">{book.title}</p>
                                        <p className="text-xs text-gray-500">{book.author}</p>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                                        book.status === 'Läst' ? 'bg-green-100 text-green-700' :
                                        book.status === 'Läser' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>
                                        {book.status}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Empty State - Only if no books at all */}
            {stats.total === 0 && (
                <section className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <Book size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">{t('home.startJourney')}</h3>
                    <p className="text-gray-500 mb-6">
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

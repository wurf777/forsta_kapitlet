import React, { useState, useEffect } from 'react';
import { ArrowRight, Book, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLibrary } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
    const { t } = useLanguage();
    const [currentlyReading, setCurrentlyReading] = useState([]);

    useEffect(() => {
        const library = getLibrary();
        const reading = library.filter(book => book.status === 'Läser');
        setCurrentlyReading(reading);
    }, []);

    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center py-12 space-y-6">
                <h1 className="text-5xl font-heading text-gray-900">
                    {t('home.heroTitle')} <span className="text-accent">{t('home.heroTitleHighlight')}</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    {t('home.subtitle')}
                </p>
                <div className="flex justify-center gap-4 pt-4">
                    <Link to="/recommendations" className="btn btn-primary text-lg px-8 py-3">
                        {t('home.getRecommendations')}
                    </Link>
                    <Link to="/books" className="btn btn-secondary text-lg px-8 py-3">
                        {t('home.myLibrary')}
                    </Link>
                </div>
            </section>

            {/* Currently Reading */}
            {currentlyReading.length > 0 && (
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-heading">{t('home.readingNow')}</h2>
                        <Link to="/books" className="text-accent hover:underline flex items-center gap-1">
                            {t('home.seeAll')} <ArrowRight size={16} />
                        </Link>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {currentlyReading.slice(0, 2).map((book) => (
                            <Link to={`/book/${book.id}`} key={book.id} className="card flex gap-6 hover:no-underline">
                                <div className="w-32 h-48 bg-gray-200 rounded-md flex-shrink-0 shadow-md overflow-hidden">
                                    {book.cover ? (
                                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <Book size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center space-y-2">
                                    <span className="text-sm text-accent font-semibold tracking-wide uppercase">
                                        {book.categories?.[0] || 'Roman'}
                                    </span>
                                    <h3 className="text-xl font-bold text-gray-900 leading-tight">{book.title}</h3>
                                    <p className="text-gray-600">{book.author}</p>
                                    <div className="flex items-center gap-1 text-yellow-500 pt-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={16} fill={i < book.rating ? "currentColor" : "none"} />
                                        ))}
                                    </div>
                                    {book.progress > 0 && (
                                        <>
                                            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                                                <div className="bg-accent h-2 rounded-full" style={{ width: `${book.progress}%` }}></div>
                                            </div>
                                            <p className="text-xs text-gray-500 text-right mt-1">{book.progress}% {t('home.progress')}</p>
                                        </>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* Empty State */}
            {currentlyReading.length === 0 && (
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

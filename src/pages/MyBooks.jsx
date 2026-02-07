import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BookOpen, Compass } from 'lucide-react';
import BookCard from '../components/BookCard';
import BookSearch from '../components/BookSearch';
import { getLibrary } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';

const MyBooks = () => {
    const { t } = useLanguage();
    const [searchParams] = useSearchParams();
    const [filter, setFilter] = useState('Alla');
    const [books, setBooks] = useState([]);

    const loadBooks = async () => {
        const library = await getLibrary();
        setBooks(library);
    };

    useEffect(() => {
        loadBooks();
    }, []);

    const filteredBooks = filter === 'Alla'
        ? books
        : books.filter(book => book.status === filter);

    const getTabLabel = (status) => {
        switch (status) {
            case 'Alla': return t('myBooks.all');
            case 'Läser': return t('myBooks.reading');
            case 'Vill läsa': return t('myBooks.wantToRead');
            case 'Läst': return t('myBooks.read');
            default: return status;
        }
    };

    return (
        <div className="space-y-6 md:space-y-8 fade-in-up">
            <div className="rounded-3xl border border-warm/20 bg-gradient-to-br from-bg-card via-bg-secondary to-warm-light px-5 py-6 md:px-8 md:py-8 shadow-md">
                <h1 className="text-2xl md:text-4xl font-heading text-gray-900 mb-2">{t('myBooks.title')}</h1>
                <p className="text-sm md:text-lg text-stone-700 max-w-2xl">{t('myBooks.subtitle')}</p>
            </div>

            <div className="card p-4 md:p-6 border-warm/20">
                <h3 className="font-heading text-xl text-gray-900 mb-3">{t('myBooks.addNewBook')}</h3>
                <BookSearch onBookAdded={loadBooks} initialQuery={searchParams.get('q') || ''} />
            </div>

            {books.length === 0 && (
                <div className="card p-4 md:p-6 border-warm/20 bg-gradient-to-br from-bg-card to-bg-secondary/70">
                    <div className="flex items-start gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                            <BookOpen size={18} />
                        </div>
                        <div>
                            <h3 className="font-heading text-xl text-gray-900">{t('guides.addReadBooks.title')}</h3>
                            <p className="text-sm text-stone-600">{t('guides.addReadBooks.subtitle')}</p>
                        </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-3 text-sm text-stone-700">
                        <div className="flex gap-3 rounded-xl border border-stone-200 bg-white/70 p-3">
                            <span className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">1</span>
                            <div>
                                <p className="font-semibold text-gray-900">{t('guides.addReadBooks.step1Title')}</p>
                                <p>{t('guides.addReadBooks.step1Body')}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 rounded-xl border border-stone-200 bg-white/70 p-3">
                            <span className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">2</span>
                            <div>
                                <p className="font-semibold text-gray-900">{t('guides.addReadBooks.step2Title')}</p>
                                <p>{t('guides.addReadBooks.step2Body')}</p>
                            </div>
                        </div>
                        <div className="flex gap-3 rounded-xl border border-stone-200 bg-white/70 p-3">
                            <span className="w-7 h-7 rounded-full bg-accent/15 text-accent flex items-center justify-center text-xs font-semibold flex-shrink-0">3</span>
                            <div>
                                <p className="font-semibold text-gray-900">{t('guides.addReadBooks.step3Title')}</p>
                                <p>{t('guides.addReadBooks.step3Body')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="rounded-2xl bg-bg-secondary/70 border border-stone-200 p-1.5 flex overflow-x-auto scrollbar-hide gap-1">
                {['Alla', 'Läser', 'Vill läsa', 'Läst'].map((tab) => {
                    const count = tab === 'Alla'
                        ? books.length
                        : books.filter(b => b.status === tab).length;

                    return (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-3 md:px-5 py-2 md:py-2.5 font-medium text-xs md:text-sm whitespace-nowrap rounded-xl transition-all ${filter === tab
                                ? 'bg-bg-card text-accent shadow-sm'
                                : 'text-stone-600 hover:text-stone-900'
                                }`}
                        >
                            {getTabLabel(tab)} ({count})
                        </button>
                    );
                })}
            </div>

            {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                    {filteredBooks.map((book) => (
                        <BookCard key={book.id} {...book} />
                    ))}
                </div>
            ) : (
                <div className="card text-center py-10 md:py-12 bg-gradient-to-br from-bg-card to-warm-light/70 border-warm/25">
                    <div className="w-14 h-14 rounded-full bg-warm/20 text-warm-dark mx-auto mb-3 flex items-center justify-center">
                        {filter === 'Alla' ? <BookOpen size={28} /> : <Compass size={28} />}
                    </div>
                    <p className="text-gray-900 font-heading text-xl mb-2">
                        {filter === 'Alla'
                            ? t('myBooks.emptyLibrary')
                            : `${t('myBooks.emptyCategory')} "${getTabLabel(filter)}"`}
                    </p>
                    <p className="text-stone-600 text-sm md:text-base mb-5">
                        {t('myBooks.useSearch')}
                    </p>
                    <Link to="/recommendations" className="btn btn-secondary text-sm px-4 py-2">
                        {t('home.getRecommendations')}
                    </Link>
                </div>
            )}
        </div>
    );
};

export default MyBooks;

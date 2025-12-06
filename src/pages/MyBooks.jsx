import React, { useState, useEffect } from 'react';
import BookCard from '../components/BookCard';
import BookSearch from '../components/BookSearch';
import { Filter } from 'lucide-react';
import { getLibrary } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';

const MyBooks = () => {
    const { t } = useLanguage();
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

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-heading text-gray-900">{t('myBooks.title')}</h1>
                    <p className="text-gray-600">{t('myBooks.subtitle')}</p>
                </div>
            </div>

            {/* Search Component */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-900 mb-3">{t('myBooks.addNewBook')}</h3>
                <BookSearch onBookAdded={loadBooks} />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 overflow-x-auto">
                {['Alla', 'Läser', 'Vill läsa', 'Läst'].map((tab) => {
                    const count = tab === 'Alla'
                        ? books.length
                        : books.filter(b => b.status === tab).length;

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
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${filter === tab
                                ? 'border-accent text-accent'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {getTabLabel(tab)} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            {filteredBooks.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredBooks.map((book) => (
                        <BookCard key={book.id} {...book} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg mb-2">
                        {filter === 'Alla'
                            ? t('myBooks.emptyLibrary')
                            : `${t('myBooks.emptyCategory')} "${filter}"`}
                    </p>
                    <p className="text-gray-400 text-sm">
                        {t('myBooks.useSearch')}
                    </p>
                </div>
            )}
        </div>
    );
};

export default MyBooks;

import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { searchBooks } from '../services/googleBooks';
import { addToLibrary } from '../services/storage';
import { useLanguage } from '../context/LanguageContext';
import MarkdownText from './MarkdownText';

const BookSearch = ({ onBookAdded, initialQuery = '' }) => {
    const { t } = useLanguage();
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchIdRef = useRef(0);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const currentId = ++searchIdRef.current;

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            try {
                const books = await searchBooks(query);
                if (searchIdRef.current === currentId) {
                    setResults(books);
                    setShowResults(true);
                }
            } catch (err) {
                console.error('Search error:', err);
            } finally {
                if (searchIdRef.current === currentId) {
                    setIsSearching(false);
                }
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleAddBook = async (book) => {
        const success = await addToLibrary(book);
        if (success) {
            setQuery('');
            setShowResults(false);
            onBookAdded?.();
        } else {
            alert(t('search.alreadyExists'));
        }
    };

    return (
        <div className="relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('search.placeholder')}
                    className="w-full pl-10 pr-4 py-3 border border-stone-200 rounded-xl bg-bg-card focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" size={20} />
                )}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-bg-card border border-stone-200 rounded-xl shadow-lg max-h-64 md:max-h-96 overflow-y-auto">
                    {results.map((book) => (
                        <div
                            key={book.id}
                            className="group border-b border-stone-100 last:border-b-0 transition-all"
                        >
                            <div className="flex gap-2 md:gap-3 p-2.5 md:p-3 hover:bg-bg-secondary/60 cursor-pointer">
                                <div className="w-12 h-16 bg-stone-200 rounded flex-shrink-0 overflow-hidden">
                                    {book.cover ? (
                                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                            📚
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <h4 className="font-semibold text-sm text-gray-900 truncate flex items-center gap-2">
                                        {book.title}
                                        {book.source === 'db' && (
                                            <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded-full border border-emerald-200" title="Från lokal databas">
                                                DB
                                            </span>
                                        )}
                                        {book.source === 'google' && (
                                            <span className="bg-accent-light text-accent-dark text-[10px] px-1.5 py-0.5 rounded-full border border-accent/20" title="Från Google Books">
                                                Google
                                            </span>
                                        )}
                                    </h4>
                                    <p className="text-xs text-stone-600 truncate">{book.author}</p>
                                    {book.published && (
                                        <p className="text-xs text-stone-500">{book.published}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleAddBook(book)}
                                    className="flex-shrink-0 p-2 text-accent hover:bg-accent-light rounded-md transition-colors"
                                    title={t('search.addToLibrary')}
                                >
                                    <Plus size={20} />
                                </button>
                            </div>

                            {/* Expandable description on hover */}
                            {book.synopsis && (
                                <div className="max-h-0 overflow-hidden group-hover:max-h-48 transition-all duration-300 ease-in-out">
                                    <div className="px-3 pb-3 pt-0">
                                        <div className="bg-bg-secondary/50 p-3 rounded-lg border border-stone-200">
                                            <MarkdownText
                                                text={book.synopsis}
                                                className="text-sm text-stone-700 leading-relaxed line-clamp-4"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {showResults && results.length === 0 && !isSearching && (
                <div className="absolute z-50 w-full mt-2 bg-bg-card border border-stone-200 rounded-xl shadow-lg p-4 text-center text-stone-500">
                    {t('search.noResults')} "{query}"
                </div>
            )}
        </div>
    );
};

export default BookSearch;

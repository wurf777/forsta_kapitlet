import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import { searchBooks } from '../services/googleBooks';
import { addToLibrary } from '../services/storage';

const BookSearch = ({ onBookAdded }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setShowResults(false);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsSearching(true);
            const books = await searchBooks(query);
            setResults(books);
            setShowResults(true);
            setIsSearching(false);
        }, 500); // Debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleAddBook = (book) => {
        const success = addToLibrary(book);
        if (success) {
            setQuery('');
            setShowResults(false);
            onBookAdded?.();
        } else {
            alert('Den här boken finns redan i ditt bibliotek!');
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
                    placeholder="Sök efter böcker att lägga till..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                />
                {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-accent animate-spin" size={20} />
                )}
            </div>

            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                    {results.map((book) => (
                        <div
                            key={book.id}
                            className="flex gap-3 p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                            <div className="w-12 h-16 bg-gray-200 rounded flex-shrink-0 overflow-hidden">
                                {book.cover ? (
                                    <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                        📚
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h4 className="font-semibold text-sm text-gray-900 truncate">{book.title}</h4>
                                <p className="text-xs text-gray-600 truncate">{book.author}</p>
                                {book.published && (
                                    <p className="text-xs text-gray-500">{book.published}</p>
                                )}
                            </div>
                            <button
                                onClick={() => handleAddBook(book)}
                                className="flex-shrink-0 p-2 text-accent hover:bg-accent-light rounded-md transition-colors"
                                title="Lägg till i biblioteket"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showResults && results.length === 0 && !isSearching && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                    Inga böcker hittades för "{query}"
                </div>
            )}
        </div>
    );
};

export default BookSearch;

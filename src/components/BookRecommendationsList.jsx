import React, { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { getBookRecommendations } from '../services/gemini';
import { searchBooks } from '../services/googleBooks';
import { addToLibrary } from '../services/storage';

const BookRecommendationsList = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [enrichedBooks, setEnrichedBooks] = useState([]);

    const handleGetRecommendations = async () => {
        setIsLoading(true);
        setError(null);
        setRecommendations([]);
        setEnrichedBooks([]);

        try {
            // Get recommendations from Gemini
            const recs = await getBookRecommendations();
            setRecommendations(recs);

            // Enrich with Google Books data
            const enriched = await Promise.all(
                recs.map(async (rec) => {
                    try {
                        const results = await searchBooks(`${rec.title} ${rec.author}`);
                        const bookData = results[0]; // Take first result
                        return {
                            ...rec,
                            googleBook: bookData || null
                        };
                    } catch (err) {
                        console.error(`Failed to fetch data for ${rec.title}:`, err);
                        return { ...rec, googleBook: null };
                    }
                })
            );

            setEnrichedBooks(enriched);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddBook = (book) => {
        if (book.googleBook) {
            const success = addToLibrary(book.googleBook);
            if (success) {
                alert(`"${book.title}" har lagts till i din boklista!`);
            } else {
                alert('Boken finns redan i din lista.');
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with button */}
            <div className="text-center">
                <button
                    onClick={handleGetRecommendations}
                    disabled={isLoading}
                    className="btn btn-primary px-8 py-3 text-lg font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 size={20} className="animate-spin" />
                            Bibbi tänker...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} />
                            Hitta nya böcker
                        </>
                    )}
                </button>
                <p className="text-sm text-gray-600 mt-2">
                    Bibbi analyserar din boklista och hittar 10 nya böcker åt dig
                </p>
            </div>

            {/* Error message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    <p className="font-semibold">Något gick fel</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {/* Loading state */}
            {isLoading && (
                <div className="text-center py-8">
                    <Loader2 size={40} className="animate-spin text-accent mx-auto mb-3" />
                    <p className="text-gray-600">Bibbi letar efter perfekta böcker åt dig...</p>
                </div>
            )}

            {/* Recommendations list */}
            {enrichedBooks.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-heading text-xl font-bold text-gray-900">
                        Bibbi's rekommendationer
                    </h3>
                    <div className="space-y-3">
                        {enrichedBooks.map((book, index) => (
                            <div
                                key={index}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex gap-4">
                                    {/* Book cover */}
                                    {book.googleBook?.imageLinks?.thumbnail ? (
                                        <img
                                            src={book.googleBook.imageLinks.thumbnail}
                                            alt={book.title}
                                            className="w-16 h-24 object-cover rounded shadow-sm flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-16 h-24 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                            <span className="text-gray-400 text-xs">Ingen bild</span>
                                        </div>
                                    )}

                                    {/* Book info */}
                                    <div className="flex-grow min-w-0">
                                        <h4 className="font-bold text-gray-900 truncate">
                                            {book.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 mb-2">
                                            av {book.author}
                                        </p>
                                        <p className="text-sm text-gray-700 line-clamp-2">
                                            {book.reason}
                                        </p>
                                    </div>

                                    {/* Add button */}
                                    <button
                                        onClick={() => handleAddBook(book)}
                                        disabled={!book.googleBook}
                                        className="btn btn-secondary px-3 py-2 rounded-lg flex-shrink-0 self-start disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Lägg till i min lista"
                                    >
                                        <Plus size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && enrichedBooks.length === 0 && recommendations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    <Sparkles size={48} className="mx-auto mb-3 text-gray-300" />
                    <p>Klicka på knappen ovan för att få personliga bokrekommendationer!</p>
                </div>
            )}
        </div>
    );
};

export default BookRecommendationsList;

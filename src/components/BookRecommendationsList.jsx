import React, { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { getBookRecommendations } from '../services/gemini';
import { searchBooks } from '../services/googleBooks';
import { addToLibrary, getUserProfile } from '../services/storage';

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
            // Get recommendations from Gemini (now includes metadata!)
            const profile = getUserProfile();
            const recs = await getBookRecommendations(null, profile);
            setRecommendations(recs);

            // Fetch Google Books data for covers etc.
            const enriched = await Promise.all(
                recs.map(async (rec) => {
                    try {
                        const googleResults = await searchBooks(`${rec.title} ${rec.author}`);
                        const bookData = googleResults[0]; // Take first result

                        return {
                            ...rec,
                            googleBook: bookData || null,
                            // Metadata is now directly on 'rec' from Gemini
                            aiMetadata: {
                                vibe: rec.vibe,
                                tempo: rec.tempo,
                                themes: rec.themes,
                                genre_specifics: rec.genre_specifics
                            }
                        };
                    } catch (err) {
                        console.error(`Failed to fetch Google Books data for ${rec.title}:`, err);
                        return {
                            ...rec,
                            googleBook: null,
                            aiMetadata: {
                                vibe: rec.vibe,
                                tempo: rec.tempo,
                                themes: rec.themes,
                                genre_specifics: rec.genre_specifics
                            }
                        };
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
        let bookToAdd;

        if (book.googleBook) {
            bookToAdd = {
                ...book.googleBook,
                // Merge AI metadata if available
                categories: book.aiMetadata?.genre_specifics ? [book.aiMetadata.genre_specifics, ...book.googleBook.categories] : book.googleBook.categories,
                vibe: book.aiMetadata?.vibe,
                tempo: book.aiMetadata?.tempo,
                themes: book.aiMetadata?.themes,
                recommendationReason: book.reason // Persist the reason why Bibbi recommended this
            };
        } else {
            // Fallback if Google Books data is missing
            bookToAdd = {
                id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                title: book.title,
                author: book.author,
                cover: null,
                rating: 0,
                progress: 0,
                status: 'Vill läsa',
                pages: 0,
                published: 'Okänt år',
                synopsis: book.reason,
                categories: book.aiMetadata?.genre_specifics ? [book.aiMetadata.genre_specifics] : [],
                language: 'okänt',
                isbn: null,
                vibe: book.aiMetadata?.vibe,
                tempo: book.aiMetadata?.tempo,
                themes: book.aiMetadata?.themes,
                recommendationReason: book.reason
            };
        }

        const success = addToLibrary(bookToAdd);
        if (success) {
            alert(`"${book.title}" har lagts till i din boklista!`);
        } else {
            alert('Boken finns redan i din lista.');
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
                                    {book.googleBook?.cover ? (
                                        <img
                                            src={book.googleBook.cover}
                                            alt={book.title}
                                            className="w-20 h-32 object-cover rounded shadow-sm flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-20 h-32 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                                            <span className="text-gray-400 text-xs">Ingen bild</span>
                                        </div>
                                    )}

                                    {/* Book info */}
                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-900 truncate text-lg">
                                                    {book.title}
                                                </h4>
                                                <p className="text-stone-600 mb-2 font-medium">
                                                    av {book.author}
                                                </p>
                                            </div>
                                            {book.aiMetadata?.tempo && (
                                                <span className="text-xs font-bold px-2 py-1 bg-stone-100 rounded text-stone-600" title="Tempo">
                                                    ⚡ {book.aiMetadata.tempo}/5
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-gray-700 mb-3 italic">
                                            "{book.reason}"
                                        </p>

                                        {/* Metadata Chips */}
                                        {book.aiMetadata && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {book.aiMetadata.vibe && (
                                                    <span className="text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full border border-purple-100">
                                                        ✨ {book.aiMetadata.vibe}
                                                    </span>
                                                )}
                                                {book.aiMetadata.genre_specifics && (
                                                    <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100">
                                                        📚 {book.aiMetadata.genre_specifics}
                                                    </span>
                                                )}
                                                {book.aiMetadata.themes?.slice(0, 2).map(theme => (
                                                    <span key={theme} className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                                        {theme}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Add button */}
                                    <button
                                        onClick={() => handleAddBook(book)}
                                        disabled={false}
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

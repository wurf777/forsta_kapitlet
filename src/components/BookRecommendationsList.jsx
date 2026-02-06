import React, { useState } from 'react';
import { Sparkles, Plus, Loader2 } from 'lucide-react';
import { getBookRecommendations } from '../services/gemini';
import { searchBooks } from '../services/googleBooks';
import { addToLibrary, getUserProfile } from '../services/storage';
import MarkdownText from './MarkdownText';

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
            const profile = getUserProfile();
            const recs = await getBookRecommendations(null, profile);
            setRecommendations(recs);

            const enriched = await Promise.all(
                recs.map(async (rec) => {
                    try {
                        const googleResults = await searchBooks(`${rec.title} ${rec.author}`);
                        const bookData = googleResults[0];

                        return {
                            ...rec,
                            googleBook: bookData || null,
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
                categories: book.aiMetadata?.genre_specifics ? [book.aiMetadata.genre_specifics, ...book.googleBook.categories] : book.googleBook.categories,
                vibe: book.aiMetadata?.vibe,
                tempo: book.aiMetadata?.tempo,
                themes: book.aiMetadata?.themes,
                recommendationReason: book.reason
            };
        } else {
            bookToAdd = {
                id: `ai-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
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
            <div className="text-center card border-warm/20 bg-gradient-to-br from-bg-card to-bg-secondary/70">
                <button
                    onClick={handleGetRecommendations}
                    disabled={isLoading}
                    className="btn btn-primary px-6 py-3 text-base md:text-lg font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
                <p className="text-sm text-stone-600 mt-3">
                    Bibbi analyserar din boklista och hittar 10 nya böcker åt dig
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl">
                    <p className="font-semibold">Något gick fel</p>
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {isLoading && (
                <div className="text-center py-8 card bg-bg-card">
                    <Loader2 size={40} className="animate-spin text-accent mx-auto mb-3" />
                    <p className="text-stone-600">Bibbi letar efter perfekta böcker åt dig...</p>
                </div>
            )}

            {enrichedBooks.length > 0 && (
                <div className="space-y-4">
                    <h3 className="font-heading text-2xl text-gray-900 mb-0">
                        Bibbis rekommendationer
                    </h3>
                    <div className="space-y-3">
                        {enrichedBooks.map((book, index) => (
                            <div
                                key={index}
                                className="card p-4 border-warm/20"
                            >
                                <div className="flex gap-4">
                                    {book.googleBook?.cover ? (
                                        <img
                                            src={book.googleBook.cover}
                                            alt={book.title}
                                            className="w-20 h-32 object-cover rounded-lg shadow-sm flex-shrink-0 book-tilt"
                                        />
                                    ) : (
                                        <div className="w-20 h-32 bg-stone-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <span className="text-stone-400 text-xs">Ingen bild</span>
                                        </div>
                                    )}

                                    <div className="flex-grow min-w-0">
                                        <div className="flex justify-between items-start gap-2">
                                            <div>
                                                <h4 className="font-heading text-2xl text-gray-900 leading-tight mb-1">
                                                    {book.title}
                                                </h4>
                                                <p className="text-stone-600 mb-2 font-medium text-sm md:text-base">
                                                    av {book.author}
                                                </p>
                                            </div>
                                            {book.aiMetadata?.tempo && (
                                                <span className="text-xs font-bold px-2 py-1 bg-accent-light rounded-full text-accent-dark border border-accent/20" title="Tempo">
                                                    ⚡ {book.aiMetadata.tempo}/5
                                                </span>
                                            )}
                                        </div>

                                        <MarkdownText text={book.reason} className="text-sm text-stone-700 mb-3 italic space-y-2" />

                                        {book.aiMetadata && (
                                            <div className="flex flex-wrap gap-2 mb-2">
                                                {book.aiMetadata.vibe && (
                                                    <span className="text-xs px-2 py-1 bg-warm-light text-warm-dark rounded-full border border-warm/20">
                                                        ✨ {book.aiMetadata.vibe}
                                                    </span>
                                                )}
                                                {book.aiMetadata.genre_specifics && (
                                                    <span className="text-xs px-2 py-1 bg-highlight/15 text-stone-800 rounded-full border border-highlight/25">
                                                        📚 {book.aiMetadata.genre_specifics}
                                                    </span>
                                                )}
                                                {book.aiMetadata.themes?.slice(0, 2).map(theme => (
                                                    <span key={theme} className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-full">
                                                        {theme}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={() => handleAddBook(book)}
                                        disabled={false}
                                        className="btn btn-secondary px-3 py-2 rounded-xl flex-shrink-0 self-start disabled:opacity-30 disabled:cursor-not-allowed"
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

            {!isLoading && !error && enrichedBooks.length === 0 && recommendations.length === 0 && (
                <div className="text-center py-12 card text-stone-600">
                    <Sparkles size={48} className="mx-auto mb-3 text-warm" />
                    <p>Klicka på knappen ovan för att få personliga bokrekommendationer!</p>
                </div>
            )}
        </div>
    );
};

export default BookRecommendationsList;

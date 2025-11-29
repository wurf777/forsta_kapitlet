import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, MessageCircle, BookOpen, Calendar, User, Trash2 } from 'lucide-react';
import { getBookById, updateBookStatus, removeFromLibrary } from '../services/storage';

const BookDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedStatus, setEditedStatus] = useState('');
    const [editedProgress, setEditedProgress] = useState(0);
    const [editedRating, setEditedRating] = useState(0);
    const [editedNotes, setEditedNotes] = useState('');

    useEffect(() => {
        const foundBook = getBookById(id);
        if (foundBook) {
            setBook(foundBook);
            setEditedStatus(foundBook.status);
            setEditedProgress(foundBook.progress || 0);
            setEditedRating(foundBook.rating || 0);
            setEditedNotes(foundBook.notes || '');
        }
    }, [id]);

    const handleSave = () => {
        updateBookStatus(id, {
            status: editedStatus,
            progress: editedProgress,
            rating: editedRating,
            notes: editedNotes
        });
        setBook({ ...book, status: editedStatus, progress: editedProgress, rating: editedRating, notes: editedNotes });
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`Är du säker på att du vill ta bort "${book.title}" från ditt bibliotek?`)) {
            removeFromLibrary(id);
            navigate('/books');
        }
    };

    if (!book) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <p className="text-gray-500">Boken hittades inte i ditt bibliotek.</p>
                <Link to="/books" className="text-accent hover:underline mt-4 inline-block">
                    Tillbaka till biblioteket
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/books" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent mb-6 transition-colors">
                <ArrowLeft size={20} />
                Tillbaka till biblioteket
            </Link>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                    {/* Cover Section */}
                    <div className="md:w-1/3 bg-gray-100 p-8 flex items-center justify-center">
                        {book.cover ? (
                            <img src={book.cover} alt={book.title} className="w-48 shadow-xl rounded-md" />
                        ) : (
                            <div className="w-48 aspect-[2/3] bg-white shadow-xl rounded-md flex items-center justify-center text-gray-300">
                                <BookOpen size={64} />
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="md:w-2/3 p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">{book.title}</h1>
                                <p className="text-xl text-gray-600 flex items-center gap-2">
                                    <User size={18} />
                                    {book.author}
                                </p>
                            </div>
                            <div className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-semibold">
                                {book.status}
                            </div>
                        </div>

                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-6 border-b border-gray-100 pb-6">
                            <span className="flex items-center gap-1">
                                <Calendar size={16} />
                                {book.published}
                            </span>
                            {book.pages > 0 && (
                                <span className="flex items-center gap-1">
                                    <BookOpen size={16} />
                                    {book.pages} sidor
                                </span>
                            )}
                            <div className="flex items-center gap-1 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < book.rating ? "currentColor" : "none"} />
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 mb-2">Handling</h3>
                            <p className="text-gray-600 leading-relaxed">{book.synopsis}</p>
                        </div>

                        {book.recommendationReason && (
                            <div className="mb-8 bg-accent/5 p-4 rounded-lg border border-accent/10">
                                <h3 className="font-bold text-accent mb-2 flex items-center gap-2">
                                    <MessageCircle size={18} />
                                    Bibbi's motivering
                                </h3>
                                <p className="text-gray-700 italic">"{book.recommendationReason}"</p>
                            </div>
                        )}

                        {isEditing ? (
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={editedStatus}
                                        onChange={(e) => setEditedStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-accent"
                                    >
                                        <option>Vill läsa</option>
                                        <option>Läser</option>
                                        <option>Läst</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Framsteg (%)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={editedProgress}
                                        onChange={(e) => setEditedProgress(parseInt(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Betyg</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setEditedRating(star)}
                                                className="text-yellow-500 hover:scale-110 transition-transform"
                                            >
                                                <Star size={24} fill={star <= editedRating ? "currentColor" : "none"} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Mina anteckningar
                                        <span className="text-gray-500 font-normal ml-2">(Vad tyckte du om boken?)</span>
                                    </label>
                                    <textarea
                                        value={editedNotes}
                                        onChange={(e) => setEditedNotes(e.target.value)}
                                        placeholder="Skriv dina tankar om boken här... Detta hjälper Bibbi ge dig bättre rekommendationer!"
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-accent resize-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="btn btn-primary flex-1">
                                        Spara
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary flex-1">
                                        Avbryt
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {book.notes && (
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                        <h3 className="font-bold text-amber-900 mb-2">📝 Mina anteckningar</h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{book.notes}</p>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button onClick={() => setIsEditing(true)} className="btn btn-primary flex-1">
                                        {book.notes ? 'Uppdatera status & anteckningar' : 'Uppdatera status'}
                                    </button>
                                    <Link to="/recommendations" className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
                                        <MessageCircle size={20} />
                                        Prata med Bibbi om boken
                                    </Link>
                                </div>
                                <button
                                    onClick={handleDelete}
                                    className="w-full btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={20} />
                                    Ta bort från biblioteket
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookDetail;

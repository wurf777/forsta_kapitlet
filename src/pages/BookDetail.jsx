import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, MessageCircle, BookOpen, Calendar, User, Trash2, ExternalLink } from 'lucide-react';
import { getBookById, updateBookStatus, removeFromLibrary, getUserProfile } from '../services/storage';
import { getServiceLinks } from '../services/serviceLinks';
import { useLanguage } from '../context/LanguageContext';
import { useBibbi } from '../context/BibbiContext';
import { api } from '../services/api';

const BookDetail = () => {
    const { t } = useLanguage();
    const { id } = useParams();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedStatus, setEditedStatus] = useState('');
    const [editedProgress, setEditedProgress] = useState(0);
    const [editedRating, setEditedRating] = useState(0);
    const [editedNotes, setEditedNotes] = useState('');
    const [profile, setProfile] = useState(null);
    const [serviceLinks, setServiceLinks] = useState([]);
    const [isFromAPI, setIsFromAPI] = useState(false);

    const { setBookContext, clearContext, openChat } = useBibbi();

    useEffect(() => {
        const loadBook = async () => {
            // First try to get from localStorage
            let foundBook = await getBookById(id);

            // If not found and ID is numeric, try to fetch from API
            if (!foundBook && !isNaN(id)) {
                try {
                    const apiBook = await api.books.get(id);
                    foundBook = apiBook;
                    setIsFromAPI(true);
                } catch (error) {
                    console.error('Failed to fetch book from API:', error);
                }
            }

            if (foundBook) {
                setBook(foundBook);
                setEditedStatus(foundBook.status || 'Vill läsa');
                setEditedProgress(foundBook.progress || 0);
                setEditedRating(foundBook.rating || 0);
                setEditedNotes(foundBook.notes || '');

                // Set Bibbi context
                setBookContext(foundBook);

                // Load user profile and generate service links
                const userProfile = getUserProfile();
                setProfile(userProfile);
                const links = getServiceLinks(
                    foundBook,
                    userProfile.preferredServices,
                    userProfile.preferredFormats
                );
                setServiceLinks(links);
            }
        };

        loadBook();

        return () => clearContext();
    }, [id, setBookContext, clearContext]);

    const handleSave = () => {
        updateBookStatus(id, {
            status: editedStatus,
            progress: editedProgress,
            rating: editedRating,
            notes: editedNotes
        });
        const updatedBook = { ...book, status: editedStatus, progress: editedProgress, rating: editedRating, notes: editedNotes };
        setBook(updatedBook);
        setBookContext(updatedBook); // Update Bibbi context with new data
        setIsEditing(false);
    };

    const handleDelete = () => {
        if (window.confirm(`${t('bookDetail.deleteConfirm')} "${book.title}"?`)) {
            removeFromLibrary(id);
            navigate('/books');
        }
    };

    if (!book) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <p className="text-gray-500">{t('bookDetail.notFound')}</p>
                <Link to="/books" className="text-accent hover:underline mt-4 inline-block">
                    {t('bookDetail.backToLibrary')}
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/books" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent mb-6 transition-colors">
                <ArrowLeft size={20} />
                {t('bookDetail.backToLibrary')}
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
                                    {book.pages} {t('bookDetail.pages')}
                                </span>
                            )}
                            <div className="flex items-center gap-1 text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < book.rating ? "currentColor" : "none"} />
                                ))}
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="font-bold text-gray-900 mb-2">{t('bookDetail.synopsis')}</h3>
                            <p className="text-gray-600 leading-relaxed">{book.synopsis}</p>
                        </div>

                        {book.recommendationReason && (
                            <div className="mb-8 bg-accent/5 p-4 rounded-lg border border-accent/10">
                                <h3 className="font-bold text-accent mb-2 flex items-center gap-2">
                                    <MessageCircle size={18} />
                                    {t('bookDetail.bibbiReason')}
                                </h3>
                                <p className="text-gray-700 italic">"{book.recommendationReason}"</p>
                            </div>
                        )}

                        {/* Service Links */}
                        {serviceLinks.length > 0 && (
                            <div className="mb-8 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                                    <ExternalLink size={18} />
                                    {t('bookDetail.findBook')}
                                </h3>
                                {profile && (profile.preferredFormats?.length > 0 || profile.preferredServices?.length > 0) ? (
                                    <p className="text-sm text-blue-800 mb-3">
                                        {t('bookDetail.basedOnPreferences')} ({profile.preferredFormats?.join(', ') || t('bookDetail.allFormats')}):
                                    </p>
                                ) : (
                                    <p className="text-sm text-blue-800 mb-3">
                                        {t('bookDetail.noPreferencesMessage')} <Link to="/profile" className="underline font-medium">{t('bookDetail.profile')}</Link> {t('bookDetail.forPersonalSuggestions')}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {serviceLinks.map(link => (
                                        <a
                                            key={link.id}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-900 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                        >
                                            <span>{link.name}</span>
                                            <ExternalLink size={14} />
                                        </a>
                                    ))}
                                </div>
                                <p className="text-xs text-blue-700 mt-3 italic">
                                    {t('bookDetail.serviceDisclaimer')}
                                </p>
                            </div>
                        )}

                        {isFromAPI ? (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <p className="text-blue-900 mb-4">
                                    {t('bookDetail.notInLibrary') || 'Denna bok finns inte i ditt bibliotek än.'}
                                </p>
                                <button
                                    onClick={async () => {
                                        const success = await addToLibrary(book);
                                        if (success) {
                                            navigate('/'); // Reload/redirect to show new state (or force refresh if easier)
                                        } else {
                                            alert(t('search.alreadyExists') || 'Boken finns redan i ditt bibliotek');
                                        }
                                    }}
                                    className="btn btn-primary w-full"
                                >
                                    {t('bookDetail.addToLibrary') || 'Lägg till i mitt bibliotek'}
                                </button>
                            </div>
                        ) : isEditing ? (
                            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                                {/* ... existing edit form ... */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookDetail.status')}</label>
                                    <select
                                        value={editedStatus}
                                        onChange={(e) => setEditedStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-accent"
                                    >
                                        <option value="Vill läsa">{t('bookDetail.wantToRead')}</option>
                                        <option value="Läser">{t('bookDetail.reading')}</option>
                                        <option value="Läst">{t('bookDetail.read')}</option>
                                    </select>
                                </div>
                                {/* ... rest of form ... */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookDetail.progress')} (%)</label>
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{t('bookDetail.rating')}</label>
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
                                        {t('bookDetail.myNotes')}
                                    </label>
                                    <textarea
                                        value={editedNotes}
                                        onChange={(e) => setEditedNotes(e.target.value)}
                                        placeholder={t('bookDetail.notesPlaceholder')}
                                        rows="4"
                                        className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:border-accent resize-none"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleSave} className="btn btn-primary flex-1">
                                        {t('bookDetail.save')}
                                    </button>
                                    <button onClick={() => setIsEditing(false)} className="btn btn-secondary flex-1">
                                        {t('bookDetail.cancel')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {book.notes && (
                                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                                        <h3 className="font-bold text-amber-900 mb-2">📝 {t('bookDetail.myNotes')}</h3>
                                        <p className="text-gray-700 whitespace-pre-wrap">{book.notes}</p>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button onClick={() => setIsEditing(true)} className="btn btn-primary flex-1">
                                        {book.notes ? t('bookDetail.updateStatusAndNotes') : t('bookDetail.updateStatus')}
                                    </button>
                                    <button onClick={openChat} className="btn btn-secondary flex-1 flex items-center justify-center gap-2">
                                        <MessageCircle size={20} />
                                        {t('bookDetail.talkToBibbi')}
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        if (confirm(t('bookDetail.confirmDelete', { title: book.title }))) {
                                            handleDelete();
                                        }
                                    }}
                                    className="w-full btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex items-center justify-center gap-2"
                                >
                                    <Trash2 size={20} />
                                    {t('bookDetail.removeFromLibrary')}
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

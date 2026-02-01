import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, ArrowLeft, MessageCircle, BookOpen, Calendar, User, Trash2, ExternalLink, Pencil } from 'lucide-react';
import { getBookById, updateBookStatus, removeFromLibrary, getUserProfile, addToLibrary } from '../services/storage';
import { getServiceLinks } from '../services/serviceLinks';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/useAuth';
import { useBibbi } from '../context/BibbiContext';
import { api } from '../services/api';
import { normalizeBookText } from '../utils/text';
import MarkdownText from '../components/MarkdownText';

const BookDetail = () => {
    const { t } = useLanguage();
    const { isAdmin } = useAuth();
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
    const [isAdminEditing, setIsAdminEditing] = useState(false);
    const [adminEditData, setAdminEditData] = useState({});
    const [adminSaving, setAdminSaving] = useState(false);
    const [isCoverCleared, setIsCoverCleared] = useState(false);

    const { setBookContext, clearContext, openChat } = useBibbi();

    useEffect(() => {
        const loadBook = async () => {
            // First try to get from localStorage
            let foundBook = await getBookById(id);

            // If not found and ID is numeric, try to fetch from API
            if (!foundBook && !isNaN(id)) {
                try {
                    const apiBook = await api.books.get(id);
                    foundBook = normalizeBookText(apiBook);
                    setIsFromAPI(true);
                } catch (error) {
                    console.error('Failed to fetch book from API:', error);
                }
            }

            if (foundBook) {
                const normalizedBook = normalizeBookText(foundBook);
                setBook(normalizedBook);
                setEditedStatus(normalizedBook.status || 'Vill läsa');
                setEditedProgress(normalizedBook.progress || 0);
                setEditedRating(normalizedBook.rating || 0);
                setEditedNotes(normalizedBook.notes || '');

                // Set Bibbi context
                setBookContext(normalizedBook);

                // Load user profile and generate service links
                const userProfile = getUserProfile();
                setProfile(userProfile);
                const links = getServiceLinks(
                    normalizedBook,
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

    const handleStatusChange = (newStatus) => {
        setEditedStatus(newStatus);
        if (newStatus === 'Läst') {
            setEditedProgress(100);
        }
    };

    const handleDelete = () => {
        if (window.confirm(`${t('bookDetail.deleteConfirm')} "${book.title}"?`)) {
            removeFromLibrary(id);
            navigate('/books');
        }
    };

    const handleAdminEdit = () => {
        setAdminEditData({
            title: book.title || '',
            description: book.synopsis || book.description || '',
            page_count: book.pages || book.page_count || 0,
            published_date: book.published || book.published_date || '',
            publisher: book.publisher || '',
            cover_url: book.cover || book.cover_url || '',
            subtitle: book.subtitle || '',
            isbn_13: book.isbn_13 || book.isbn || '',
            isbn_10: book.isbn_10 || '',
        });
        setIsCoverCleared(false);
        setIsAdminEditing(true);
    };

    const handleAdminSave = async () => {
        setAdminSaving(true);
        try {
            const bookDbId = book.dbId || book.id;
            const normalizedCover = adminEditData.cover_url?.trim();
            const payload = {
                ...adminEditData,
                cover_url: isCoverCleared ? '' : (normalizedCover || book.cover || book.cover_url || ''),
            };
            await api.admin.updateBook(bookDbId, payload);
            // Update local state
            setBook(prev => ({
                ...prev,
                title: adminEditData.title,
                synopsis: adminEditData.description,
                description: adminEditData.description,
                pages: adminEditData.page_count,
                page_count: adminEditData.page_count,
                published: adminEditData.published_date,
                published_date: adminEditData.published_date,
                publisher: adminEditData.publisher,
                cover: payload.cover_url,
                cover_url: payload.cover_url,
                subtitle: adminEditData.subtitle,
                isbn_13: adminEditData.isbn_13,
                isbn_10: adminEditData.isbn_10,
            }));
            setIsAdminEditing(false);
        } catch (error) {
            console.error('Failed to update book:', error);
            alert('Kunde inte spara bokändringarna.');
        } finally {
            setAdminSaving(false);
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
        <div className="max-w-4xl mx-auto px-4">
            <Link to="/books" className="inline-flex items-center gap-2 text-gray-500 hover:text-accent mb-4 md:mb-6 transition-colors">
                <ArrowLeft size={20} />
                {t('bookDetail.backToLibrary')}
            </Link>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                    {/* Cover Section */}
                    <div className="md:w-1/3 bg-gray-100 p-6 md:p-8 flex items-center justify-center">
                        {book.cover ? (
                            <img src={book.cover} alt={book.title} className="w-40 md:w-48 shadow-xl rounded-md" />
                        ) : (
                            <div className="w-40 md:w-48 aspect-[2/3] bg-white shadow-xl rounded-md flex items-center justify-center text-gray-300">
                                <BookOpen size={48} className="md:w-16 md:h-16" />
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div className="md:w-2/3 p-5 md:p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 min-w-0 pr-3">
                                <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-2">{book.title}</h1>
                                <p className="text-lg md:text-xl text-gray-600 flex items-center gap-2">
                                    <User size={16} className="md:w-[18px] md:h-[18px] flex-shrink-0" />
                                    <span className="truncate">{book.author}</span>
                                </p>
                            </div>
                            <div className="bg-accent/10 text-accent px-2.5 md:px-3 py-1 rounded-full text-xs md:text-sm font-semibold whitespace-nowrap flex-shrink-0">
                                {book.status}
                            </div>
                        </div>

                        {isAdmin && !isAdminEditing && (
                            <button
                                onClick={handleAdminEdit}
                                className="mb-4 inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent/80 transition-colors"
                            >
                                <Pencil size={14} />
                                Redigera bokinfo
                            </button>
                        )}

                        {isAdminEditing && (
                            <div className="mb-6 space-y-3 bg-amber-50 p-4 rounded-lg border border-amber-200">
                                <h3 className="font-bold text-amber-900 mb-2">Redigera bokinfo (admin)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Titel</label>
                                        <input type="text" value={adminEditData.title} onChange={e => setAdminEditData(d => ({ ...d, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Undertitel</label>
                                        <input type="text" value={adminEditData.subtitle} onChange={e => setAdminEditData(d => ({ ...d, subtitle: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Sidantal</label>
                                        <input type="number" value={adminEditData.page_count} onChange={e => setAdminEditData(d => ({ ...d, page_count: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Utgivningsdatum</label>
                                        <input type="text" value={adminEditData.published_date} onChange={e => setAdminEditData(d => ({ ...d, published_date: e.target.value }))} placeholder="YYYY-MM-DD" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Förlag</label>
                                        <input type="text" value={adminEditData.publisher} onChange={e => setAdminEditData(d => ({ ...d, publisher: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                    <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Omslags-URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={adminEditData.cover_url}
                                                onChange={e => {
                                                    setIsCoverCleared(false);
                                                    setAdminEditData(d => ({ ...d, cover_url: e.target.value }));
                                                }}
                                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setIsCoverCleared(true);
                                                    setAdminEditData(d => ({ ...d, cover_url: '' }));
                                                }}
                                                className="btn btn-secondary px-3"
                                                title="Rensa omslagsbild"
                                            >
                                                Rensa
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">ISBN-13</label>
                                        <input type="text" value={adminEditData.isbn_13} onChange={e => setAdminEditData(d => ({ ...d, isbn_13: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">ISBN-10</label>
                                        <input type="text" value={adminEditData.isbn_10} onChange={e => setAdminEditData(d => ({ ...d, isbn_10: e.target.value }))} className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Beskrivning</label>
                                    <textarea value={adminEditData.description} onChange={e => setAdminEditData(d => ({ ...d, description: e.target.value }))} rows="4" className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-accent resize-none" />
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleAdminSave} disabled={adminSaving} className="btn btn-primary flex-1">
                                        {adminSaving ? 'Sparar...' : 'Spara'}
                                    </button>
                                    <button onClick={() => setIsAdminEditing(false)} className="btn btn-secondary flex-1">
                                        Avbryt
                                    </button>
                                </div>
                            </div>
                        )}

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
                            <MarkdownText text={book.synopsis} className="text-gray-600 leading-relaxed space-y-2" />
                        </div>

                        {book.recommendationReason && (
                            <div className="mb-8 bg-accent/5 p-4 rounded-lg border border-accent/10">
                                <h3 className="font-bold text-accent mb-2 flex items-center gap-2">
                                    <MessageCircle size={18} />
                                    {t('bookDetail.bibbiReason')}
                                </h3>
                                <MarkdownText text={book.recommendationReason} className="text-gray-700 italic space-y-2" />
                            </div>
                        )}

                        {/* Service Links */}
                        {serviceLinks.length > 0 && (
                            <div className="mb-6 md:mb-8 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                                <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-sm md:text-base">
                                    <ExternalLink size={18} />
                                    {t('bookDetail.findBook')}
                                </h3>
                                {profile && (profile.preferredFormats?.length > 0 || profile.preferredServices?.length > 0) ? (
                                    <p className="text-xs md:text-sm text-blue-800 mb-3">
                                        {t('bookDetail.basedOnPreferences')} ({profile.preferredFormats?.join(', ') || t('bookDetail.allFormats')}):
                                    </p>
                                ) : (
                                    <p className="text-xs md:text-sm text-blue-800 mb-3">
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
                                            className="inline-flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 bg-white border border-blue-200 rounded-lg text-xs md:text-sm font-medium text-blue-900 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                                        >
                                            <span className="truncate max-w-[150px] md:max-w-none">{link.name}</span>
                                            <ExternalLink size={12} className="md:w-3.5 md:h-3.5 flex-shrink-0" />
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
                                        onChange={(e) => handleStatusChange(e.target.value)}
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
                                        <MarkdownText text={book.notes} className="text-gray-700 space-y-2" />
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

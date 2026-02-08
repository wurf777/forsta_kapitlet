/**
 * Storage service
 * Uses API for authenticated users
 *
 * TODO: Migrera till PWA för riktig offline-support.
 * Se doc/TODO-pwa.md för detaljer.
 *
 * Nuvarande problem med localStorage-approachen:
 * - Ingen riktig offline-upplevelse (bara preferenser cachas)
 * - Konflikthantering saknas vid flera enheter
 * - localStorage kan bli out-of-sync med backend
 */

import { api, getAuthToken } from './api';
import { normalizeBookListText } from '../utils/text';
import { track } from './analytics';

const PROFILE_KEY = 'forsta_kapitlet_profile';
const DAILY_TIP_KEY = 'forsta_kapitlet_daily_tip';

// Check if user is authenticated
const isAuthenticated = () => {
    return !!getAuthToken();
};

// --- Library Management ---

export const getLibrary = async () => {
    if (isAuthenticated()) {
        try {
            const books = await api.user.getBooks();
            return normalizeBookListText(books);
        } catch (error) {
            console.error('Failed to get books from API:', error);
        }
    }

    return [];
};

export const addToLibrary = async (book) => {
    if (!isAuthenticated()) {
        throw new Error('Du måste vara inloggad för att lägga till böcker.');
    }

    // Book needs to exist in books table first
    // If it has a dbId, use that, otherwise create it
    let bookId = book.dbId;

    if (!bookId) {
        // Create book in database first
        // Convert published year to proper DATE format (YYYY-MM-DD) or NULL
        let publishedDate = null;
        if (book.published && book.published !== 'Okänt år') {
            // If it's just a year, make it YYYY-01-01
            publishedDate = book.published.length === 4
                ? `${book.published}-01-01`
                : book.published;
        }

        const created = await api.books.create({
            title: book.title,
            author: book.author,
            isbn: book.isbn,
            synopsis: book.synopsis,
            cover: book.cover,
            pages: book.pages,
            publishedDate: publishedDate,
            language: book.language || 'sv',
            googleBooksId: book.googleBooksId || book.id,
        });
        bookId = created.book.id;
    }

    // Add to user's library
    await api.user.addBook(
        bookId,
        book.status || 'Vill läsa',
        book.rating || 0,
        book.progress || 0,
        book.notes || ''
    );

    track('books', 'add_to_library', {
        book_title: book.title,
        author: book.author,
        source: book._trackingSource || 'search',
    }, { bookId });

    return true;
};

export const updateBookStatus = async (bookId, updates) => {
    // Auto-set progress to 100 when status changes to "Läst"
    if (updates.status === 'Läst' && updates.progress === undefined) {
        updates = { ...updates, progress: 100 };
    }

    if (!isAuthenticated()) {
        throw new Error('Du måste vara inloggad för att uppdatera böcker.');
    }

    // Find book's database ID
    const library = await getLibrary();
    const book = library.find(b => b.id === bookId || b.dbId === parseInt(bookId));

    if (book && book.dbId) {
        await api.user.updateBook(book.dbId, updates);
        track('books', 'update_status', {
            status: updates.status,
            rating: updates.rating,
            progress: updates.progress,
        }, { bookId: book.dbId });
        return library.map(b =>
            b.id === bookId ? { ...b, ...updates } : b
        );
    }

    throw new Error('Kunde inte hitta boken.');
};

export const removeFromLibrary = async (bookId) => {
    if (!isAuthenticated()) {
        throw new Error('Du måste vara inloggad för att ta bort böcker.');
    }

    // Find book's database ID
    const library = await getLibrary();
    const book = library.find(b => b.id === bookId || b.dbId === parseInt(bookId));

    if (book && book.dbId) {
        await api.user.removeBook(book.dbId);
        track('books', 'remove_from_library', {
            book_title: book.title,
        }, { bookId: book.dbId });
        return library.filter(b => b.id !== bookId);
    }

    throw new Error('Kunde inte hitta boken.');
};

export const getBookById = async (bookId) => {
    const library = await getLibrary();
    return library.find(book => book.id === bookId || book.dbId === parseInt(bookId));
};

// --- Helper functions for Autocomplete ---

export const getUniqueAuthors = async () => {
    const library = await getLibrary();
    const authors = new Set();
    library.forEach(book => {
        if (book.authors && Array.isArray(book.authors)) {
            book.authors.forEach(author => authors.add(author));
        } else if (book.author) {
            authors.add(book.author);
        }
    });
    return Array.from(authors).sort();
};

export const getUniqueGenres = async () => {
    const library = await getLibrary();
    const genres = new Set();

    // Add common genres
    const COMMON_GENRES = [
        "Deckare", "Fantasy", "Science Fiction", "Biografi", "Historia",
        "Roman", "Skräck", "Thriller", "Feelgood", "Klassiker",
        "Poesi", "Fakta", "Barnböcker", "Ungdomsböcker"
    ];
    COMMON_GENRES.forEach(g => genres.add(g));

    // Add genres from library
    library.forEach(book => {
        if (book.categories && Array.isArray(book.categories)) {
            book.categories.forEach(cat => genres.add(cat));
        }
    });

    return Array.from(genres).sort();
};

// --- User Profile Storage ---

const DEFAULT_PROFILE = {
    favoriteAuthors: [],
    favoriteGenres: [],
    blocklist: {
        authors: [],
        genres: [],
        books: []
    },
    modes: {},
    preferredFormats: [],
    preferredServices: []
};

export const getUserProfile = () => {
    const stored = localStorage.getItem(PROFILE_KEY);
    return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
};

/**
 * Fetch profile from backend and merge into localStorage.
 * Call this after login to hydrate local state from the database.
 */
export const fetchUserProfile = async () => {
    if (!isAuthenticated()) return getUserProfile();

    try {
        const data = await api.user.getProfile();
        const serverProfile = data.profile || {};

        // Map backend structure to frontend structure
        const merged = {
            ...DEFAULT_PROFILE,
            favoriteAuthors: serverProfile.favoriteAuthors || [],
            favoriteGenres: serverProfile.favoriteGenres || [],
            blocklist: {
                authors: serverProfile.blockedAuthors || [],
                genres: serverProfile.blockedGenres || [],
                books: []
            },
            preferredFormats: serverProfile.preferences?.preferredFormats || [],
            preferredServices: serverProfile.preferences?.preferredServices || [],
            modes: serverProfile.preferences?.modes || {}
        };

        localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
        return merged;
    } catch (error) {
        console.error('Failed to fetch profile from API, using localStorage:', error);
        return getUserProfile();
    }
};

/**
 * Convert frontend profile structure to the flat format the backend expects.
 */
const profileToApiFormat = (profile) => ({
    favoriteAuthors: profile.favoriteAuthors || [],
    favoriteGenres: profile.favoriteGenres || [],
    blockedAuthors: profile.blocklist?.authors || [],
    blockedGenres: profile.blocklist?.genres || [],
    preferredFormats: profile.preferredFormats || [],
    preferredServices: profile.preferredServices || [],
    modes: profile.modes || {}
});

export const updateUserProfile = (updates) => {
    const profile = getUserProfile();
    const newProfile = { ...profile, ...updates };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));

    // Invalidate daily tip cache so next Home load generates a fresh tip
    localStorage.removeItem(DAILY_TIP_KEY);

    // Sync to backend when authenticated (fire-and-forget)
    if (isAuthenticated()) {
        api.user.updateProfile(profileToApiFormat(newProfile)).catch(error => {
            console.error('Failed to sync profile to API:', error);
        });
    }

    return newProfile;
};

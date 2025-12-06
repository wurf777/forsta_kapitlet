/**
 * Hybrid storage service
 * Uses API when authenticated, falls back to localStorage
 */

import { api, getAuthToken } from './api';

const STORAGE_KEY = 'forsta_kapitlet_library';
const PROFILE_KEY = 'forsta_kapitlet_profile';

// Check if user is authenticated
const isAuthenticated = () => {
    return !!getAuthToken();
};

// --- Library Management ---

export const getLibrary = async () => {
    if (isAuthenticated()) {
        try {
            return await api.user.getBooks();
        } catch (error) {
            console.error('Failed to get books from API, using localStorage:', error);
            // Fallback to localStorage
        }
    }

    // Use localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const addToLibrary = async (book) => {
    if (isAuthenticated()) {
        try {
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
            return true;
        } catch (error) {
            console.error('Failed to add book via API:', error);
            // Fallback to localStorage
        }
    }

    // Use localStorage
    const library = await getLibrary();
    if (library.some(b => b.id === book.id)) return false;

    const newLibrary = [book, ...library];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
    return true;
};

export const updateBookStatus = async (bookId, updates) => {
    if (isAuthenticated()) {
        try {
            // Find book's database ID
            const library = await getLibrary();
            const book = library.find(b => b.id === bookId || b.dbId === parseInt(bookId));

            if (book && book.dbId) {
                await api.user.updateBook(book.dbId, updates);
                return library.map(b =>
                    b.id === bookId ? { ...b, ...updates } : b
                );
            }
        } catch (error) {
            console.error('Failed to update book via API:', error);
        }
    }

    // Use localStorage
    const library = await getLibrary();
    const newLibrary = library.map(book =>
        book.id === bookId ? { ...book, ...updates } : book
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
    return newLibrary;
};

export const removeFromLibrary = async (bookId) => {
    if (isAuthenticated()) {
        try {
            // Find book's database ID
            const library = await getLibrary();
            const book = library.find(b => b.id === bookId || b.dbId === parseInt(bookId));

            if (book && book.dbId) {
                await api.user.removeBook(book.dbId);
                return library.filter(b => b.id !== bookId);
            }
        } catch (error) {
            console.error('Failed to remove book via API:', error);
        }
    }

    // Use localStorage
    const library = await getLibrary();
    const newLibrary = library.filter(book => book.id !== bookId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
    return newLibrary;
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
    // Profile is still in localStorage for now
    // TODO: Move to database in future
    const stored = localStorage.getItem(PROFILE_KEY);
    return stored ? { ...DEFAULT_PROFILE, ...JSON.parse(stored) } : DEFAULT_PROFILE;
};

export const updateUserProfile = (updates) => {
    const profile = getUserProfile();
    const newProfile = { ...profile, ...updates };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(newProfile));
    return newProfile;
};

// --- Data Export/Import ---

export const exportData = async () => {
    const library = await getLibrary();
    const profile = getUserProfile();

    const data = {
        library,
        profile,
        timestamp: new Date().toISOString(),
        version: 1
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `forsta_kapitlet_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importData = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.library || !data.profile) {
                    throw new Error('Ogiltigt filformat');
                }

                localStorage.setItem(STORAGE_KEY, JSON.stringify(data.library));
                localStorage.setItem(PROFILE_KEY, JSON.stringify(data.profile));

                resolve(true);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Kunde inte läsa filen'));
        reader.readAsText(file);
    });
};

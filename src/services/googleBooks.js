// Service for interacting with Google Books API
import { api } from './api';
import { decodeHtmlEntities } from '../utils/text';

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';
const ENABLE_LOCAL_DB = import.meta.env.VITE_ENABLE_LOCAL_DB !== 'false'; // Default to true

/**
 * Hybrid search: local database first, then Google Books API
 */
export const searchBooks = async (query) => {
    if (!query) return [];

    let localResults = [];

    // 1. Try local database first (if enabled)
    if (ENABLE_LOCAL_DB) {
        try {
            localResults = await api.books.search(query, 10);
            console.log(`Found ${localResults.length} books in local database`);

            // Mark local results source
            localResults = localResults.map(book => ({ ...book, source: 'db' }));

            // If we have enough high-quality results, return them
            if (localResults.length >= 5) {
                return localResults;
            }
        } catch (error) {
            console.warn("Local database search failed, falling back to Google Books:", error);
        }
    }

    // 2. Complement with Google Books API
    try {
        const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=sv`);
        const data = await response.json();

        if (!data.items) return localResults;

        const googleResults = data.items.map(book => ({ ...formatBookData(book), source: 'google' }));

        // 3. Save new books to database in background (don't wait)
        /* 
        // OPTIONAL: Auto-save all search results to build local cache. 
        // Disabled to keep database clean and only contain books users actually interact with.
        if (ENABLE_LOCAL_DB) {
            googleResults.forEach(book => {
                api.books.create({
                    googleBooksId: book.id,
                    title: book.title,
                    author: book.author,
                    authors: book.author.split(', '),
                    isbn: book.isbn,
                    cover: book.cover,
                    coverThumbnail: book.cover,
                    synopsis: book.synopsis,
                    description: book.synopsis,
                    pages: book.pages,
                    publishedDate: book.publishedDate,
                    language: book.language,
                    categories: book.categories,
                    source: 'google_books'
                }).catch(err => {
                    // Silently fail - book might already exist
                    console.debug('Failed to save book to database:', err.message);
                });
            });
        }
        */

        // 4. Combine and deduplicate results
        return deduplicateBooks([...localResults, ...googleResults]);

    } catch (error) {
        console.error("Error fetching from Google Books:", error);
        return localResults; // Return whatever we have from local DB
    }
};

/**
 * Deduplicate books based on ISBN or Google Books ID
 */
const deduplicateBooks = (books) => {
    const seen = new Set();
    return books.filter(book => {
        const key = book.isbn || book.googleBooksId || book.id || book.title.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

export const formatBookData = (googleBook) => {
    const info = googleBook.volumeInfo;

    // Try to get the best available image
    const images = info.imageLinks || {};
    const coverUrl = images.extraLarge || images.large || images.medium || images.thumbnail || images.smallThumbnail || null;

    // Find ISBN-13 if available
    const isbn = info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier ||
        info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || null;

    return {
        id: googleBook.id,
        title: info.title,
        author: info.authors ? info.authors.join(', ') : 'Okänd författare',
        cover: coverUrl?.replace('http:', 'https:') || null,
        rating: 0, // Default for new books
        progress: 0,
        status: 'Vill läsa', // Default status
        pages: info.pageCount || 0,
        published: info.publishedDate?.substring(0, 4) || 'Okänt år',
        publishedDate: info.publishedDate || null,
        synopsis: decodeHtmlEntities(info.description || 'Ingen beskrivning tillgänglig.'),
        categories: info.categories || [],
        language: info.language || 'okänt',
        isbn: isbn
    };
};

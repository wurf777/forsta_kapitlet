// Service for interacting with Google Books API

const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

export const searchBooks = async (query) => {
    if (!query) return [];

    try {
        const response = await fetch(`${BASE_URL}?q=${encodeURIComponent(query)}&maxResults=10&langRestrict=sv`);
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map(formatBookData);
    } catch (error) {
        console.error("Error fetching from Google Books:", error);
        return [];
    }
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
        synopsis: info.description || 'Ingen beskrivning tillgänglig.',
        categories: info.categories || [],
        language: info.language || 'okänt',
        isbn: isbn
    };
};

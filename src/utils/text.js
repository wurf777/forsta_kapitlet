export const decodeHtmlEntities = (value) => {
    if (!value || typeof value !== 'string') return value ?? '';

    if (typeof document === 'undefined') {
        return value
            .replace(/&#039;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
    }

    const textarea = document.createElement('textarea');
    textarea.innerHTML = value;
    return textarea.value;
};

const decodeIfString = (value) => (typeof value === 'string' ? decodeHtmlEntities(value) : value);

export const normalizeBookText = (book) => {
    if (!book || typeof book !== 'object') return book;

    const normalized = {
        ...book,
        title: decodeIfString(book.title),
        author: decodeIfString(book.author),
        subtitle: decodeIfString(book.subtitle),
        synopsis: decodeIfString(book.synopsis),
        description: decodeIfString(book.description),
        publisher: decodeIfString(book.publisher),
    };

    if (Array.isArray(book.authors)) {
        normalized.authors = book.authors.map(decodeIfString);
    }

    if (Array.isArray(book.categories)) {
        normalized.categories = book.categories.map(decodeIfString);
    }

    return normalized;
};

export const normalizeBookListText = (books) => (
    Array.isArray(books) ? books.map(normalizeBookText) : books
);

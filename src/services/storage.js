// Service for Local Storage persistence

const STORAGE_KEY = 'forsta_kapitlet_library';

export const getLibrary = () => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const addToLibrary = (book) => {
    const library = getLibrary();
    if (library.some(b => b.id === book.id)) return false; // Already exists

    const newLibrary = [book, ...library];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
    return true;
};

export const updateBookStatus = (bookId, updates) => {
    const library = getLibrary();
    const newLibrary = library.map(book =>
        book.id === bookId ? { ...book, ...updates } : book
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
    return newLibrary;
};

export const removeFromLibrary = (bookId) => {
    const library = getLibrary();
    const newLibrary = library.filter(book => book.id !== bookId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLibrary));
    return newLibrary;
};

export const getBookById = (bookId) => {
    const library = getLibrary();
    return library.find(book => book.id === bookId);
};

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

// --- Helper functions for Autocomplete ---

export const getUniqueAuthors = () => {
    const library = getLibrary();
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

export const getUniqueGenres = () => {
    const library = getLibrary();
    const genres = new Set();

    // Add common genres to ensure there are always suggestions
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

const PROFILE_KEY = 'forsta_kapitlet_profile';

const DEFAULT_PROFILE = {
    favoriteAuthors: [],
    favoriteGenres: [],
    blocklist: {
        authors: [],
        genres: [],
        books: [] // Store book IDs or titles
    },
    modes: {
        // Default mode settings can go here later
    },
    preferredFormats: [], // e.g., ['Ljudbok', 'E-bok', 'Pappersbok']
    preferredServices: [] // e.g., ['Storytel', 'BookBeat', 'Bibliotek']
};

export const getUserProfile = () => {
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

export const exportData = () => {
    const library = getLibrary();
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

                // Basic validation
                if (!data.library || !data.profile) {
                    throw new Error('Ogiltigt filformat');
                }

                // Save to storage
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

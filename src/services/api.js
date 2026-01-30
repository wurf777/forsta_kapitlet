/**
 * API Client for one.com backend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api';

class APIError extends Error {
    constructor(message, statusCode, data) {
        super(message);
        this.statusCode = statusCode;
        this.data = data;
    }
}

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => {
    return localStorage.getItem('authToken');
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

/**
 * Base fetch wrapper with error handling
 */
const apiFetch = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add auth token if available
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new APIError(
                data.error || 'Request failed',
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }

        // Network error or JSON parse error
        throw new APIError(
            'Network error or server unavailable',
            0,
            { originalError: error.message }
        );
    }
};

/**
 * API methods
 */
export const api = {
    // Books
    books: {
        search: async (query, limit = 10, offset = 0) => {
            return apiFetch(`/books/search.php?q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
        },

        get: async (id) => {
            return apiFetch(`/books/get.php?id=${id}`);
        },

        create: async (bookData) => {
            return apiFetch('/books/create.php', {
                method: 'POST',
                body: JSON.stringify(bookData),
            });
        },
    },

    // Authentication
    auth: {
        register: async (email, password, name) => {
            return apiFetch('/auth/register.php', {
                method: 'POST',
                body: JSON.stringify({ email, password, name }),
            });
        },

        login: async (email, password) => {
            const data = await apiFetch('/auth/login.php', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });

            // Store token
            if (data.token) {
                setAuthToken(data.token);
            }

            return data;
        },

        logout: () => {
            setAuthToken(null);
        },

        requestPasswordReset: async (email) => {
            return apiFetch('/auth/reset-password.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'request', email }),
            });
        },

        resetPassword: async (token, password) => {
            return apiFetch('/auth/reset-password.php', {
                method: 'POST',
                body: JSON.stringify({ action: 'reset', token, password }),
            });
        },

        verify: async (token) => {
            return apiFetch(`/auth/verify.php?token=${token}`);
        },
    },

    // User library management
    user: {
        getBooks: async () => {
            return apiFetch('/user/books.php');
        },

        addBook: async (bookId, status = 'Vill läsa', rating = 0, progress = 0, notes = '') => {
            return apiFetch('/user/add-book.php', {
                method: 'POST',
                body: JSON.stringify({ bookId, status, rating, progress, notes }),
            });
        },

        updateBook: async (bookId, updates) => {
            return apiFetch('/user/update-book.php', {
                method: 'PUT',
                body: JSON.stringify({ bookId, ...updates }),
            });
        },

        removeBook: async (bookId) => {
            return apiFetch(`/user/remove-book.php?bookId=${bookId}`, {
                method: 'DELETE',
            });
        },

        getProfile: async () => {
            return apiFetch('/user/profile.php');
        },

        updateProfile: async (profileData) => {
            return apiFetch('/user/profile.php', {
                method: 'PUT',
                body: JSON.stringify(profileData),
            });
        },
    },

    // Admin user management
    admin: {
        listUsers: async (search = '', limit = 50, offset = 0) => {
            const params = new URLSearchParams({
                limit: limit.toString(),
                offset: offset.toString()
            });
            if (search) {
                params.append('search', search);
            }
            return apiFetch(`/admin/users.php?${params.toString()}`);
        },

        createUser: async (userData) => {
            return apiFetch('/admin/users.php', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
        },

        updateUser: async (userId, updates) => {
            return apiFetch('/admin/users.php', {
                method: 'PUT',
                body: JSON.stringify({ id: userId, ...updates }),
            });
        },

        deleteUser: async (userId) => {
            return apiFetch(`/admin/users.php?id=${userId}`, {
                method: 'DELETE',
            });
        },

        updateBook: async (bookId, data) => {
            return apiFetch('/books/update.php', {
                method: 'PUT',
                body: JSON.stringify({ id: bookId, ...data }),
            });
        },
    },
};

export { APIError };

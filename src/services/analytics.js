/**
 * Frontend analytics tracking service
 *
 * Queues events in memory and batch-sends to the backend.
 * Only tracks when the user is authenticated.
 */

import { getAuthToken } from './api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api';
const SESSION_KEY = 'fk_analytics_session';
const FLUSH_INTERVAL = 30_000; // 30 seconds
const BATCH_SIZE = 10;

let eventQueue = [];
let flushTimer = null;

/**
 * Get or create a session ID for this browser tab
 */
function getSessionId() {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
}

/**
 * Track an analytics event
 * @param {string} category - 'auth' | 'books' | 'search' | 'bibbi' | 'profile'
 * @param {string} action - e.g. 'add_to_library', 'chat_message'
 * @param {object} data - Event-specific payload
 * @param {object} options - { bookId, searchQuery }
 */
export function track(category, action, data = {}, { bookId = null, searchQuery = null } = {}) {
    if (!getAuthToken()) return;

    eventQueue.push({
        category,
        action,
        data,
        book_id: bookId,
        search_query: searchQuery,
        timestamp: new Date().toISOString(),
    });

    if (eventQueue.length >= BATCH_SIZE) {
        flush();
    } else if (!flushTimer) {
        flushTimer = setTimeout(flush, FLUSH_INTERVAL);
    }
}

/**
 * Send queued events to the backend
 */
async function flush() {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    if (eventQueue.length === 0) return;

    const events = [...eventQueue];
    eventQueue = [];

    const payload = {
        session_id: getSessionId(),
        events,
    };

    const token = getAuthToken();
    if (!token) return;

    try {
        await fetch(`${API_BASE_URL}/analytics/track.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
    } catch {
        // Re-queue on failure — will retry on next flush
        eventQueue = [...events, ...eventQueue];
    }
}

/**
 * Flush remaining events when the page unloads
 */
if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
        if (eventQueue.length === 0) return;
        const token = getAuthToken();
        if (!token) return;

        navigator.sendBeacon(
            `${API_BASE_URL}/analytics/track.php`,
            new Blob(
                [JSON.stringify({ session_id: getSessionId(), events: eventQueue, token })],
                { type: 'application/json' }
            )
        );
    });
}

/**
 * Export session ID for the X-Session-ID header
 */
export function getAnalyticsSessionId() {
    return getSessionId();
}

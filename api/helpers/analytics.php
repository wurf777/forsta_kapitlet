<?php
/**
 * Server-side analytics helper
 * Logs events to log_events and manages log_sessions
 */

require_once __DIR__ . '/../config.php';

/**
 * Generate a pseudonymized user hash
 */
function getUserHash($userId) {
    $salt = $_ENV['LOG_HASH_SALT'] ?? 'default-change-me';
    return hash('sha256', $userId . $salt);
}

/**
 * Get session ID from request header
 */
function getSessionId() {
    $headers = getallheaders();
    return $headers['X-Session-ID'] ?? $headers['x-session-id'] ?? null;
}

/**
 * Log an analytics event (server-side)
 */
function logEvent($userId, $sessionId, $category, $action, $data = [], $bookId = null, $searchQuery = null) {
    if (!$sessionId) return;

    try {
        $db = getDB();
        $userHash = getUserHash($userId);

        // Insert event
        $stmt = $db->prepare("
            INSERT INTO log_events (user_hash, session_id, event_category, event_action, event_data, book_id, search_query)
            VALUES (:user_hash, :session_id, :category, :action, :data, :book_id, :search_query)
        ");
        $stmt->execute([
            'user_hash' => $userHash,
            'session_id' => $sessionId,
            'category' => $category,
            'action' => $action,
            'data' => json_encode($data),
            'book_id' => $bookId,
            'search_query' => $searchQuery ? substr($searchQuery, 0, 500) : null,
        ]);

        // Upsert session
        $stmt = $db->prepare("
            INSERT INTO log_sessions (session_id, user_hash, had_bibbi_chat, had_bibbi_recommendations, had_book_add)
            VALUES (:session_id, :user_hash, :had_chat, :had_recs, :had_add)
            ON DUPLICATE KEY UPDATE
                last_active_at = CURRENT_TIMESTAMP,
                had_bibbi_chat = had_bibbi_chat OR VALUES(had_bibbi_chat),
                had_bibbi_recommendations = had_bibbi_recommendations OR VALUES(had_bibbi_recommendations),
                had_book_add = had_book_add OR VALUES(had_book_add)
        ");
        $stmt->execute([
            'session_id' => $sessionId,
            'user_hash' => $userHash,
            'had_chat' => ($category === 'bibbi' && $action === 'chat_message') ? 1 : 0,
            'had_recs' => ($category === 'bibbi' && $action === 'get_recommendations') ? 1 : 0,
            'had_add' => ($category === 'books' && $action === 'add_to_library') ? 1 : 0,
        ]);
    } catch (Exception $e) {
        // Analytics should never break the main flow
        error_log("Analytics error: " . $e->getMessage());
    }
}

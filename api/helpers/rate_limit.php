<?php
/**
 * Simple database-backed rate limiting.
 *
 * Usage:
 *   require_once __DIR__ . '/../helpers/rate_limit.php';
 *   if (!checkRateLimit($_SERVER['REMOTE_ADDR'], 'login', 5, 900)) {
 *       sendError('Too many attempts. Please try again later.', 429);
 *   }
 */

/**
 * Check whether an identifier has exceeded the allowed number of attempts
 * within the rolling time window, and record this attempt.
 *
 * @param string $identifier  IP address or email
 * @param string $action      e.g. 'login', 'register', 'reset'
 * @param int    $maxAttempts Maximum allowed attempts in the window
 * @param int    $windowSecs  Rolling window in seconds (default 15 min)
 * @return bool  true = allowed, false = rate-limited
 */
function checkRateLimit(string $identifier, string $action, int $maxAttempts = 5, int $windowSecs = 900): bool {
    $db = getDB();
    $windowStart = date('Y-m-d H:i:s', time() - $windowSecs);

    // Prune expired rows for this identifier/action to keep the table small
    $db->prepare("DELETE FROM rate_limits WHERE identifier = :id AND action = :action AND created_at < :window")
       ->execute(['id' => $identifier, 'action' => $action, 'window' => $windowStart]);

    // Count recent attempts
    $stmt = $db->prepare(
        "SELECT COUNT(*) AS cnt FROM rate_limits
         WHERE identifier = :id AND action = :action AND created_at >= :window"
    );
    $stmt->execute(['id' => $identifier, 'action' => $action, 'window' => $windowStart]);
    $count = (int)($stmt->fetch()['cnt'] ?? 0);

    if ($count >= $maxAttempts) {
        return false;
    }

    // Record this attempt
    $db->prepare("INSERT INTO rate_limits (identifier, action) VALUES (:id, :action)")
       ->execute(['id' => $identifier, 'action' => $action]);

    return true;
}

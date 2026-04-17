<?php
/**
 * Event ingestion endpoint
 * POST /api/analytics/track.php
 *
 * Accepts batches of analytics events from the frontend.
 * Requires authentication (any logged-in user).
 */

require_once __DIR__ . '/../config.php';
require_once __DIR__ . '/../helpers/analytics.php';

// Support both regular POST and sendBeacon
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data) {
    sendError('Invalid JSON data');
}

// For sendBeacon requests, the token may be in the body
$token = null;
$headers = getallheaders();
$authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
    $token = $matches[1];
}

if (!$token) {
    sendError('Unauthorized', 401);
}

$user = verifyJWT($token);
if (!$user) {
    sendError('Unauthorized', 401);
}

$sessionId = $data['session_id'] ?? null;
$events = $data['events'] ?? [];

if (!$sessionId || !is_array($events) || count($events) === 0) {
    sendError('session_id and events array required');
}

// Limit batch size
if (count($events) > 50) {
    $events = array_slice($events, 0, 50);
}

$validCategories = ['auth', 'books', 'search', 'bibbi', 'profile'];
$tracked = 0;

foreach ($events as $event) {
    $category = $event['category'] ?? '';
    $action = $event['action'] ?? '';

    if (!in_array($category, $validCategories) || empty($action)) {
        continue;
    }

    logEvent(
        $user['user_id'],
        $sessionId,
        $category,
        $action,
        $event['data'] ?? [],
        $event['book_id'] ?? null,
        $event['search_query'] ?? null
    );

    $tracked++;
}

sendResponse(['success' => true, 'tracked' => $tracked]);

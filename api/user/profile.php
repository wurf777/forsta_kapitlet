<?php
/**
 * User profile management
 * GET  /api/user/profile.php  — fetch profile
 * PUT  /api/user/profile.php  — update profile
 */

require_once '../config.php';

$user = requireAuth();
$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->prepare("SELECT * FROM user_profiles WHERE user_id = :user_id");
    $stmt->execute(['user_id' => $user['user_id']]);
    $profile = $stmt->fetch();

    sendResponse([
        'success' => true,
        'profile' => [
            'favoriteAuthors' => json_decode($profile['favorite_authors'] ?? '[]', true),
            'favoriteGenres' => json_decode($profile['favorite_genres'] ?? '[]', true),
            'blockedAuthors' => json_decode($profile['blocked_authors'] ?? '[]', true),
            'blockedGenres' => json_decode($profile['blocked_genres'] ?? '[]', true),
            'preferences' => json_decode($profile['preferences'] ?? '{}', true)
        ]
    ]);
} elseif ($method === 'PUT') {
    $data = getJsonInput();

    if (!$data) {
        sendError('Invalid JSON data');
    }

    $favoriteAuthors = json_encode($data['favoriteAuthors'] ?? [], JSON_UNESCAPED_UNICODE);
    $favoriteGenres = json_encode($data['favoriteGenres'] ?? [], JSON_UNESCAPED_UNICODE);
    $blockedAuthors = json_encode($data['blockedAuthors'] ?? [], JSON_UNESCAPED_UNICODE);
    $blockedGenres = json_encode($data['blockedGenres'] ?? [], JSON_UNESCAPED_UNICODE);

    // Pack preferredFormats & preferredServices into the preferences JSON column
    $preferences = json_encode([
        'preferredFormats' => $data['preferredFormats'] ?? [],
        'preferredServices' => $data['preferredServices'] ?? [],
        'modes' => $data['modes'] ?? (object)[]
    ], JSON_UNESCAPED_UNICODE);

    try {
        $stmt = $db->prepare("
            INSERT INTO user_profiles (user_id, favorite_authors, favorite_genres, blocked_authors, blocked_genres, preferences)
            VALUES (:user_id, :fav_authors, :fav_genres, :block_authors, :block_genres, :preferences)
            ON DUPLICATE KEY UPDATE
                favorite_authors = VALUES(favorite_authors),
                favorite_genres = VALUES(favorite_genres),
                blocked_authors = VALUES(blocked_authors),
                blocked_genres = VALUES(blocked_genres),
                preferences = VALUES(preferences)
        ");

        $stmt->execute([
            'user_id' => $user['user_id'],
            'fav_authors' => $favoriteAuthors,
            'fav_genres' => $favoriteGenres,
            'block_authors' => $blockedAuthors,
            'block_genres' => $blockedGenres,
            'preferences' => $preferences
        ]);

        sendResponse(['success' => true]);
    } catch (PDOException $e) {
        error_log("Profile update error: " . $e->getMessage());
        sendError('Failed to update profile', 500);
    }
} else {
    sendError('Method not allowed', 405);
}

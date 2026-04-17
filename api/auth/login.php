<?php
/**
 * User login
 * POST /api/auth/login.php
 */

require_once '../config.php';
require_once '../helpers/analytics.php';
require_once '../helpers/rate_limit.php';

$data = getJsonInput();

if (!$data) {
    sendError('Invalid JSON data');
}

// Validate input
$email = sanitize($data['email'] ?? '');
$password = $data['password'] ?? '';

// Rate limit: 10 attempts per IP per 15 minutes
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
if (!checkRateLimit($ip, 'login', 10, 900)) {
    sendError('Too many login attempts. Please try again later.', 429);
}

if (empty($email) || !validateEmail($email)) {
    sendError('Valid email is required');
}

if (empty($password)) {
    sendError('Password is required');
}

$db = getDB();

try {
    // Get user
    $stmt = $db->prepare("SELECT * FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('Invalid credentials', 401);
    }
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        sendError('Invalid credentials', 401);
    }
    
    // Check if email is verified (optional - you can remove this check if you want)
    // if (!$user['verified_at']) {
    //     sendError('Please verify your email first', 403);
    // }
    
    // Generate JWT token
    $token = generateJWT($user['id'], $user['email']);
    
    // Get user profile
    $stmt = $db->prepare("SELECT * FROM user_profiles WHERE user_id = :user_id");
    $stmt->execute(['user_id' => $user['id']]);
    $profile = $stmt->fetch();
    
    logEvent($user['id'], getSessionId(), 'auth', 'login');

    sendResponse([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => (int)$user['id'],
            'email' => $user['email'],
            'name' => $user['name'],
            'verified' => !empty($user['verified_at']),
            'isAdmin' => !empty($user['is_admin']),
            'profile' => [
                'favoriteAuthors' => json_decode($profile['favorite_authors'] ?? '[]'),
                'favoriteGenres' => json_decode($profile['favorite_genres'] ?? '[]'),
                'blockedAuthors' => json_decode($profile['blocked_authors'] ?? '[]'),
                'blockedGenres' => json_decode($profile['blocked_genres'] ?? '[]'),
                'preferences' => json_decode($profile['preferences'] ?? '{}')
            ]
        ]
    ]);
    
} catch (PDOException $e) {
    error_log("Login error: " . $e->getMessage());
    sendError('Login failed', 500);
}

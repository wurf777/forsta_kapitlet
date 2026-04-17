<?php
/**
 * Gemini API key management
 *
 * GET    /api/user/api-key.php  → { hasKey: bool, maskedKey: "AIzaSy****xyz" }
 * POST   /api/user/api-key.php  → { success: true }   (validates + saves key)
 * DELETE /api/user/api-key.php  → { success: true }   (removes key)
 *
 * The key is never returned in full – only a masked version is shown to the user.
 * At rest the key is encrypted with AES-256-CBC using a key derived from JWT_SECRET.
 */

require_once __DIR__ . '/../config.php';

$user = requireAuth();
$userId = $user['user_id'];

// ── Encryption helpers ──────────────────────────────────────────────────────

function encryptKey(string $plaintext): string {
    $encKey = substr(hash('sha256', JWT_SECRET . '_gemini_key', true), 0, 32);
    $iv     = random_bytes(16);
    $cipher = openssl_encrypt($plaintext, 'AES-256-CBC', $encKey, OPENSSL_RAW_DATA, $iv);
    return base64_encode($iv . $cipher);
}

function decryptKey(string $stored): ?string {
    $encKey = substr(hash('sha256', JWT_SECRET . '_gemini_key', true), 0, 32);
    $raw    = base64_decode($stored);
    if (strlen($raw) <= 16) return null;
    $iv     = substr($raw, 0, 16);
    $cipher = substr($raw, 16);
    $plain  = openssl_decrypt($cipher, 'AES-256-CBC', $encKey, OPENSSL_RAW_DATA, $iv);
    return ($plain === false) ? null : $plain;
}

function maskKey(string $key): string {
    if (strlen($key) < 12) return '****';
    return substr($key, 0, 8) . str_repeat('*', max(strlen($key) - 12, 8)) . substr($key, -4);
}

// ── Validate key format ────────────────────────────────────────────────────

function isValidGeminiKeyFormat(string $key): bool {
    // Accept any non-empty key of reasonable length (Google changes key formats)
    return strlen($key) >= 10 && strlen($key) <= 1000;
}

// ── Test key against Gemini API ────────────────────────────────────────────

function testGeminiKey(string $apiKey): bool {
    $url  = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' . urlencode($apiKey);
    $body = json_encode([
        'contents'         => [['role' => 'user', 'parts' => [['text' => 'Hi']]]],
        'generationConfig' => ['maxOutputTokens' => 8],
    ]);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $body,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 10,
    ]);
    $httpCode = 0;
    curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    return $httpCode === 200;
}

// ── Fetch stored key ───────────────────────────────────────────────────────

function getStoredKey(int $userId): ?string {
    $db   = getDB();
    $stmt = $db->prepare('SELECT gemini_api_key FROM user_profiles WHERE user_id = :uid LIMIT 1');
    $stmt->execute(['uid' => $userId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['gemini_api_key'])) return null;
    return decryptKey($row['gemini_api_key']);
}

// ── Route ──────────────────────────────────────────────────────────────────

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $plain = getStoredKey($userId);
    if ($plain === null) {
        sendResponse(['hasKey' => false, 'maskedKey' => null]);
    } else {
        sendResponse(['hasKey' => true, 'maskedKey' => maskKey($plain)]);
    }
}

if ($method === 'POST') {
    $data   = getJsonInput();
    $apiKey = trim($data['apiKey'] ?? '');

    if (empty($apiKey)) {
        sendError('apiKey är obligatorisk', 400);
    }

    if (!isValidGeminiKeyFormat($apiKey)) {
        sendError('Ogiltigt nyckelformat. Nyckeln ska börja med "AIzaSy" och vara 39 tecken lång.', 400);
    }

    if (!testGeminiKey($apiKey)) {
        sendError('Nyckeln fungerar inte. Kontrollera att den är rätt och försök igen.', 400);
    }

    $encrypted = encryptKey($apiKey);
    $db   = getDB();
    $stmt = $db->prepare('
        INSERT INTO user_profiles (user_id, gemini_api_key)
        VALUES (:uid, :key)
        ON DUPLICATE KEY UPDATE gemini_api_key = VALUES(gemini_api_key)
    ');
    $stmt->execute(['uid' => $userId, 'key' => $encrypted]);

    sendResponse(['success' => true, 'maskedKey' => maskKey($apiKey)]);
}

if ($method === 'DELETE') {
    $db   = getDB();
    $stmt = $db->prepare('UPDATE user_profiles SET gemini_api_key = NULL WHERE user_id = :uid');
    $stmt->execute(['uid' => $userId]);

    sendResponse(['success' => true]);
}

sendError('Metod inte tillåten', 405);

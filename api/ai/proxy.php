<?php
/**
 * Gemini AI proxy
 * POST /api/ai/proxy.php
 *
 * Uses the authenticated user's own Gemini API key (stored encrypted in user_profiles).
 * Returns HTTP 402 with { error: "no_api_key" } if no key has been saved.
 *
 * Request body:
 *   {
 *     "contents": [{"role": "user"|"model", "parts": [{"text": "..."}]}, ...],
 *     "system_instruction": "optional system prompt string",
 *     "generation_config": { "temperature": 0.9, "maxOutputTokens": 2048 }
 *   }
 *
 * Response:
 *   { "text": "response text from Gemini" }
 */

require_once __DIR__ . '/../config.php';

$user   = requireAuth();
$userId = $user['user_id'];

$data = getJsonInput();
if (!$data || empty($data['contents'])) {
    sendError('contents array is required');
}

// ── Fetch and decrypt the user's API key ───────────────────────────────────

function getUserGeminiKey(int $userId): ?string {
    $db   = getDB();
    $stmt = $db->prepare('SELECT gemini_api_key FROM user_profiles WHERE user_id = :uid LIMIT 1');
    $stmt->execute(['uid' => $userId]);
    $row = $stmt->fetch();
    if (!$row || empty($row['gemini_api_key'])) return null;

    $encKey = substr(hash('sha256', JWT_SECRET . '_gemini_key', true), 0, 32);
    $raw    = base64_decode($row['gemini_api_key']);
    if (strlen($raw) <= 16) return null;
    $iv     = substr($raw, 0, 16);
    $cipher = substr($raw, 16);
    $plain  = openssl_decrypt($cipher, 'AES-256-CBC', $encKey, OPENSSL_RAW_DATA, $iv);
    return ($plain === false) ? null : $plain;
}

$apiKey = getUserGeminiKey($userId);

if (!$apiKey) {
    http_response_code(402);
    echo json_encode(['error' => 'no_api_key'], JSON_UNESCAPED_UNICODE);
    exit();
}

// ── Call Gemini API ────────────────────────────────────────────────────────

$model             = 'gemini-2.5-flash';
$contents          = $data['contents'];
$systemInstruction = $data['system_instruction'] ?? null;
$generationConfig  = $data['generation_config'] ?? [
    'temperature'     => 0.9,
    'topP'            => 0.95,
    'topK'            => 40,
    'maxOutputTokens' => 2048,
];

$url  = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key=" . urlencode($apiKey);
$body = [
    'contents'         => $contents,
    'generationConfig' => $generationConfig,
];

if ($systemInstruction) {
    $body['system_instruction'] = ['parts' => [['text' => $systemInstruction]]];
}

$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_UNICODE),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 90,
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr  = curl_error($ch);
curl_close($ch);

if ($curlErr) {
    error_log("[AI proxy] curl error: $curlErr");
    sendError('AI service unreachable', 502);
}

if ($httpCode !== 200) {
    error_log("[AI proxy] Gemini HTTP $httpCode: $response");
    // Surface API key errors clearly so the user knows to check their key
    if ($httpCode === 400 || $httpCode === 403) {
        sendError('Din API-nyckel verkar inte fungera. Gå till din profil och kontrollera nyckeln.', 400);
    }
    sendError('AI service error', 502);
}

$result = json_decode($response, true);

// Gemini 2.5 Flash (thinking model) may return multiple parts where
// parts with "thought: true" are internal reasoning. Find the actual text.
$text = null;
foreach ($result['candidates'][0]['content']['parts'] ?? [] as $part) {
    if (!empty($part['text']) && empty($part['thought'])) {
        $text = $part['text'];
        break;
    }
}

if ($text === null) {
    error_log("[AI proxy] Unexpected Gemini response: $response");
    sendError('No response from AI', 502);
}

sendResponse(['text' => $text]);

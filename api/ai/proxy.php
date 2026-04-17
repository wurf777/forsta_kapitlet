<?php
/**
 * Gemini AI proxy
 * POST /api/ai/proxy.php
 *
 * Keeps the Gemini API key server-side. Requires authentication.
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

// Must be authenticated
requireAuth();

$data = getJsonInput();
if (!$data || empty($data['contents'])) {
    sendError('contents array is required');
}

$apiKey = $_ENV['GEMINI_API_KEY'] ?? '';
if (!$apiKey) {
    sendError('AI service is not configured', 503);
}

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
    CURLOPT_TIMEOUT        => 30,
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
    sendError('AI service error', 502);
}

$result = json_decode($response, true);
$text   = $result['candidates'][0]['content']['parts'][0]['text'] ?? null;

if ($text === null) {
    error_log("[AI proxy] Unexpected Gemini response: $response");
    sendError('No response from AI', 502);
}

sendResponse(['text' => $text]);

<?php
/**
 * Read recent PHP error log entries.
 * DELETE THIS FILE after debugging — it exposes server internals.
 *
 * GET /api/read-log.php?key=YOUR_SECRET
 */

header('Content-Type: text/plain; charset=utf-8');

// Simple access key — change this before deploying
$accessKey = 'forsta-debug-2026';

if (($_GET['key'] ?? '') !== $accessKey) {
    http_response_code(403);
    echo 'Forbidden';
    exit();
}

$logPath = ini_get('error_log');

if (!$logPath || !file_exists($logPath)) {
    echo "Error log path: " . ($logPath ?: '(not set)') . "\n";
    echo "File exists: no\n\n";
    echo "Try checking one.com control panel for error logs.";
    exit();
}

// Read last 100 lines
$lines = file($logPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
if ($lines === false) {
    echo "Could not read log file: $logPath";
    exit();
}

$tail = array_slice($lines, -100);
echo "=== Last " . count($tail) . " lines from $logPath ===\n\n";
echo implode("\n", $tail);

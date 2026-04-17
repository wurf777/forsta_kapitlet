<?php
/**
 * Read recent PHP error log entries.
 * Only available in development environment.
 *
 * GET /api/read-log.php?key=YOUR_SECRET
 */

// Load .env to check environment
if (file_exists(__DIR__ . '/.env')) {
    $env = parse_ini_file(__DIR__ . '/.env');
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

// Block in production
if (($_ENV['ENVIRONMENT'] ?? 'production') !== 'development') {
    http_response_code(404);
    exit;
}

header('Content-Type: text/plain; charset=utf-8');

// Access key from env, not hardcoded
$accessKey = $_ENV['LOG_ACCESS_KEY'] ?? '';

if (empty($accessKey) || ($_GET['key'] ?? '') !== $accessKey) {
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

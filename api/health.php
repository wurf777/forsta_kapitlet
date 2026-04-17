<?php
/**
 * Health check endpoint
 * GET /api/health.php
 *
 * Returns verbose diagnostics only in development.
 * In production returns a minimal {healthy: true/false}.
 */

header('Content-Type: application/json; charset=utf-8');

// Load .env to determine environment
if (file_exists(__DIR__ . '/.env')) {
    $env = parse_ini_file(__DIR__ . '/.env');
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

$isDevelopment = ($_ENV['ENVIRONMENT'] ?? 'production') === 'development';

require_once __DIR__ . '/config.php';

// Test DB connection
$dbOk = false;
$dbError = null;
try {
    $pdo = getDB();
    $pdo->query("SELECT 1");
    $dbOk = true;
} catch (Throwable $e) {
    $dbError = $isDevelopment ? $e->getMessage() : 'unavailable';
}

$allOk = $dbOk
    && extension_loaded('pdo_mysql')
    && file_exists(__DIR__ . '/.env');

http_response_code($allOk ? 200 : 500);

if ($isDevelopment) {
    echo json_encode([
        'healthy' => $allOk,
        'checks' => [
            'php_version' => phpversion(),
            'timestamp' => date('c'),
            'env_file' => file_exists(__DIR__ . '/.env'),
            'extensions' => [
                'pdo' => extension_loaded('pdo'),
                'pdo_mysql' => extension_loaded('pdo_mysql'),
                'mbstring' => extension_loaded('mbstring'),
                'json' => extension_loaded('json'),
            ],
            'db' => $dbOk ? ['status' => 'ok'] : ['status' => 'error', 'message' => $dbError],
        ],
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    echo json_encode(['healthy' => $allOk], JSON_UNESCAPED_UNICODE);
}

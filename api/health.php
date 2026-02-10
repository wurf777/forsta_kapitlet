<?php
/**
 * Health check / diagnostics endpoint
 * GET /api/health.php
 *
 * DELETE THIS FILE or restrict access in production once debugging is done.
 */

header('Content-Type: application/json; charset=utf-8');

$checks = [
    'php_version' => phpversion(),
    'timestamp' => date('c'),
    'env_file' => file_exists(__DIR__ . '/.env'),
    'env_readable' => is_readable(__DIR__ . '/.env'),
    'extensions' => [
        'pdo' => extension_loaded('pdo'),
        'pdo_mysql' => extension_loaded('pdo_mysql'),
        'mbstring' => extension_loaded('mbstring'),
        'json' => extension_loaded('json'),
    ],
    'db' => null,
    'error_log_writable' => is_writable(ini_get('error_log') ?: sys_get_temp_dir()),
];

// Test DB connection
try {
    require_once __DIR__ . '/config.php';
    $pdo = getDB();
    $stmt = $pdo->query("SELECT 1");
    $checks['db'] = ['status' => 'ok', 'host' => DB_HOST, 'name' => DB_NAME];
} catch (Throwable $e) {
    $checks['db'] = ['status' => 'error', 'message' => $e->getMessage()];
}

$allOk = $checks['env_file']
    && $checks['extensions']['pdo_mysql']
    && ($checks['db']['status'] ?? '') === 'ok';

http_response_code($allOk ? 200 : 500);

echo json_encode([
    'healthy' => $allOk,
    'checks' => $checks,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

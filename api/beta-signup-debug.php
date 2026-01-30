<?php
/**
 * Debug version of Beta Signup
 */

// Enable full error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    require_once __DIR__ . '/config.php';

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }

    $input = getJsonInput();

    if (empty($input['name']) || empty($input['email'])) {
        sendError('Namn och e-postadress krävs', 400);
    }

    $name = sanitize($input['name']);
    $email = sanitize($input['email']);
    $message = sanitize($input['message'] ?? '');

    if (!validateEmail($email)) {
        sendError('Ogiltig e-postadress', 400);
    }

    // Try database save first (skip email for now)
    try {
        $db = getDB();

        // Create table if it doesn't exist
        $db->exec("CREATE TABLE IF NOT EXISTS beta_signups (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_email (email),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

        // Insert signup
        $stmt = $db->prepare("INSERT INTO beta_signups (name, email, message) VALUES (?, ?, ?)");
        $stmt->execute([$name, $email, $message]);

    } catch (PDOException $e) {
        sendError('Database error: ' . $e->getMessage(), 500);
    }

    // Send success response (skip email for now)
    sendResponse([
        'success' => true,
        'message' => 'Tack för din anmälan! Vi återkommer till dig inom kort.',
        'debug' => 'Database save successful'
    ], 200);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}

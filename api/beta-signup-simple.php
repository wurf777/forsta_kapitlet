<?php
/**
 * Simple Beta Signup - No database required
 * Just saves to a text file and sends email
 */

error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Simple helper functions
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}

function sendError($message, $statusCode = 400) {
    sendResponse(['error' => $message], $statusCode);
}

try {
    // Only allow POST
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendError('Method not allowed', 405);
    }

    // Get input
    $input = json_decode(file_get_contents('php://input'), true);

    if (empty($input['name']) || empty($input['email'])) {
        sendError('Namn och e-postadress krävs', 400);
    }

    $name = htmlspecialchars(strip_tags(trim($input['name'])), ENT_QUOTES, 'UTF-8');
    $email = htmlspecialchars(strip_tags(trim($input['email'])), ENT_QUOTES, 'UTF-8');
    $message = htmlspecialchars(strip_tags(trim($input['message'] ?? '')), ENT_QUOTES, 'UTF-8');

    // Validate email
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        sendError('Ogiltig e-postadress', 400);
    }

    // Save to text file
    $logFile = __DIR__ . '/beta-signups.txt';
    $logEntry = date('Y-m-d H:i:s') . " | Name: {$name} | Email: {$email} | Message: {$message}\n";
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);

    // Prepare email
    $to = 'christian@silvervidh.se';
    $subject = 'Ny beta-testare anmäld: ' . $name;

    $emailBody = "En ny person har anmält sig som beta-testare!\n\n";
    $emailBody .= "Namn: {$name}\n";
    $emailBody .= "E-post: {$email}\n\n";

    if (!empty($message)) {
        $emailBody .= "Meddelande:\n{$message}\n\n";
    }

    $emailBody .= "---\n";
    $emailBody .= "Skickat från Första kapitlet beta-anmälan\n";
    $emailBody .= "Datum: " . date('Y-m-d H:i:s') . "\n";

    // Email headers
    $headers = "From: noreply@silvervidh.se\r\n";
    $headers .= "Reply-To: {$email}\r\n";
    $headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    // Try to send email (don't fail if it doesn't work)
    $mailSent = @mail($to, $subject, $emailBody, $headers);

    // Send success response (even if email failed, we saved to file)
    sendResponse([
        'success' => true,
        'message' => 'Tack för din anmälan! Vi återkommer till dig inom kort.',
        'debug' => [
            'saved_to_file' => true,
            'email_sent' => $mailSent
        ]
    ], 200);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Server error',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

<?php
/**
 * Beta Signup Endpoint
 * Handles beta tester registration and sends notification email
 */

require_once __DIR__ . '/config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

// Get input data
$input = getJsonInput();

// Validate required fields
if (empty($input['name']) || empty($input['email'])) {
    sendError('Namn och e-postadress krävs', 400);
}

$name = sanitize($input['name']);
$email = sanitize($input['email']);
$message = sanitize($input['message'] ?? '');

// Validate email
if (!validateEmail($email)) {
    sendError('Ogiltig e-postadress', 400);
}

// Prepare email to admin
$to = 'christian@silvervidh.se';
$subject = 'Ny beta-testare anmäld: ' . $name;

// Email body
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
$headers = "From: " . MAIL_FROM . "\r\n";
$headers .= "Reply-To: {$email}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "X-Mailer: PHP/" . phpversion();

// Send email
$mailSent = mail($to, $subject, $emailBody, $headers);

if (!$mailSent) {
    error_log("Failed to send beta signup email for: {$email}");
    sendError('Kunde inte skicka anmälan. Försök igen senare.', 500);
}

// Optional: Save to database for tracking
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
    // Log error but don't fail the request since email was sent
    error_log("Beta signup database error: " . $e->getMessage());
}

// Send success response
sendResponse([
    'success' => true,
    'message' => 'Tack för din anmälan! Vi återkommer till dig inom kort.'
], 200);

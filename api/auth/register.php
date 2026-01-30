<?php
/**
 * User registration
 * POST /api/auth/register.php
 */

require_once '../config.php';

$data = getJsonInput();

if (!$data) {
    sendError('Invalid JSON data');
}

// Validate input
$email = sanitize($data['email'] ?? '');
$password = $data['password'] ?? '';
$name = sanitize($data['name'] ?? '');

if (empty($email) || !validateEmail($email)) {
    sendError('Valid email is required');
}

if (empty($password) || strlen($password) < 8) {
    sendError('Password must be at least 8 characters');
}

$db = getDB();

try {
    // Check if user already exists
    $stmt = $db->prepare("SELECT id FROM users WHERE email = :email LIMIT 1");
    $stmt->execute(['email' => $email]);
    
    if ($stmt->fetch()) {
        sendError('Email already registered', 409);
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
    
    // Generate verification token
    $verificationToken = generateToken();
    
    // Check if development environment
    $isDevelopment = ($_ENV['ENVIRONMENT'] ?? 'production') === 'development';
    
    // In development, auto-verify. In production, require email verification
    $verifiedAt = $isDevelopment ? date('Y-m-d H:i:s') : null;
    
    // Create user
    $stmt = $db->prepare("
        INSERT INTO users (email, password, name, verification_token, verified_at) 
        VALUES (:email, :password, :name, :token, :verified_at)
    ");
    
    $stmt->execute([
        'email' => $email,
        'password' => $hashedPassword,
        'name' => $name,
        'token' => $verificationToken,
        'verified_at' => $verifiedAt
    ]);
    
    $userId = $db->lastInsertId();
    
    // Create user profile
    $stmt = $db->prepare("
        INSERT INTO user_profiles (user_id, favorite_authors, favorite_genres, blocked_authors, blocked_genres, preferences) 
        VALUES (:user_id, '[]', '[]', '[]', '[]', '{}')
    ");
    $stmt->execute(['user_id' => $userId]);
    
    // Send verification email only in production
    if (!$isDevelopment) {
        $verifyLink = SITE_URL . "/verify?token=" . $verificationToken;
        $subject = "Verifiera ditt konto - Första Kapitlet";
        $message = "
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Välkommen till Första Kapitlet!</h2>
                <p>Hej " . htmlspecialchars($name ?: $email) . ",</p>
                <p>Tack för att du registrerade dig! Klicka på länken nedan för att verifiera din e-postadress:</p>
                <p><a href='$verifyLink' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Verifiera konto</a></p>
                <p>Eller kopiera denna länk till din webbläsare:</p>
                <p>$verifyLink</p>
                <p>Länken är giltig i 24 timmar.</p>
                <p>Om du inte skapade detta konto kan du ignorera detta mejl.</p>
                <br>
                <p>Vänliga hälsningar,<br>Första Kapitlet</p>
            </body>
            </html>
        ";
        
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "From: " . MAIL_FROM . "\r\n";
        
        $mailSent = mail($email, $subject, $message, $headers);
        
        if (!$mailSent) {
            error_log("Failed to send verification email to: $email");
        }
        
        sendResponse([
            'success' => true,
            'message' => 'Registration successful! Please check your email to verify your account.',
            'userId' => (int)$userId
        ], 201);
    } else {
        // Development: auto-verified, no email sent
        sendResponse([
            'success' => true,
            'message' => 'Registration successful! Account auto-verified for development.',
            'userId' => (int)$userId,
            'autoVerified' => true
        ], 201);
    }

    
} catch (PDOException $e) {
    error_log("Registration error: " . $e->getMessage());
    sendError('Registration failed', 500);
}

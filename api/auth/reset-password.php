<?php
/**
 * Password reset request
 * POST /api/auth/reset-password.php
 */

require_once '../config.php';
require_once '../helpers/rate_limit.php';

$data = getJsonInput();

if (!$data) {
    sendError('Invalid JSON data');
}

$action = $data['action'] ?? 'request'; // 'request' or 'reset'

if ($action === 'request') {
    // Request password reset
    $email = sanitize($data['email'] ?? '');

    // Rate limit: 3 requests per IP per hour
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    if (!checkRateLimit($ip, 'reset', 3, 3600)) {
        // Still return success to avoid leaking whether an account exists
        sendResponse(['success' => true, 'message' => 'If an account exists with this email, a password reset link has been sent.']);
    }
    
    if (empty($email) || !validateEmail($email)) {
        sendError('Valid email is required');
    }
    
    $db = getDB();
    
    try {
        // Get user
        $stmt = $db->prepare("SELECT id, name FROM users WHERE email = :email LIMIT 1");
        $stmt->execute(['email' => $email]);
        $user = $stmt->fetch();
        
        // Always return success even if user doesn't exist (security)
        if (!$user) {
            sendResponse([
                'success' => true,
                'message' => 'If an account exists with this email, a password reset link has been sent.'
            ]);
        }
        
        // Generate reset token — store only the hash in DB, send raw token to user
        $resetToken = generateToken();
        $tokenHash = hash('sha256', $resetToken);
        $expiresAt = date('Y-m-d H:i:s', strtotime('+1 hour'));

        // Save hashed token
        $stmt = $db->prepare("
            UPDATE users
            SET reset_token = :token, reset_token_expires = :expires
            WHERE id = :id
        ");
        $stmt->execute([
            'token' => $tokenHash,
            'expires' => $expiresAt,
            'id' => $user['id']
        ]);

        // Send reset email with raw (unhashed) token
        $resetLink = SITE_URL . "/reset-password?token=" . $resetToken;
        $subject = "Återställ ditt lösenord - Första Kapitlet";
        $message = "
            <html>
            <body style='font-family: Arial, sans-serif;'>
                <h2>Återställ ditt lösenord</h2>
                <p>Hej " . htmlspecialchars($user['name'] ?: $email) . ",</p>
                <p>Vi har fått en begäran om att återställa lösenordet för ditt konto. Klicka på länken nedan för att skapa ett nytt lösenord:</p>
                <p><a href='$resetLink' style='background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;'>Återställ lösenord</a></p>
                <p>Eller kopiera denna länk till din webbläsare:</p>
                <p>$resetLink</p>
                <p>Länken är giltig i 1 timme.</p>
                <p>Om du inte begärde detta kan du ignorera detta mejl.</p>
                <br>
                <p>Vänliga hälsningar,<br>Första Kapitlet</p>
            </body>
            </html>
        ";
        
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-type: text/html; charset=utf-8\r\n";
        $headers .= "From: " . MAIL_FROM . "\r\n";
        
        mail($email, $subject, $message, $headers);
        
        sendResponse([
            'success' => true,
            'message' => 'If an account exists with this email, a password reset link has been sent.'
        ]);
        
    } catch (PDOException $e) {
        error_log("Password reset request error: " . $e->getMessage());
        sendError('Failed to process request', 500);
    }
    
} elseif ($action === 'reset') {
    // Reset password with token
    $token = $data['token'] ?? '';
    $newPassword = $data['password'] ?? '';

    if (empty($token)) {
        sendError('Reset token is required');
    }

    if (empty($newPassword) || strlen($newPassword) < 8) {
        sendError('Password must be at least 8 characters');
    }

    $db = getDB();

    try {
        // Hash the incoming token and compare against stored hash
        $tokenHash = hash('sha256', $token);
        $stmt = $db->prepare("
            SELECT id FROM users
            WHERE reset_token = :token
            AND reset_token_expires > NOW()
            LIMIT 1
        ");
        $stmt->execute(['token' => $tokenHash]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Invalid or expired reset token', 400);
        }
        
        // Hash new password
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT);
        
        // Update password and clear reset token
        $stmt = $db->prepare("
            UPDATE users 
            SET password = :password, 
                reset_token = NULL, 
                reset_token_expires = NULL 
            WHERE id = :id
        ");
        $stmt->execute([
            'password' => $hashedPassword,
            'id' => $user['id']
        ]);
        
        sendResponse([
            'success' => true,
            'message' => 'Password has been reset successfully. You can now log in with your new password.'
        ]);
        
    } catch (PDOException $e) {
        error_log("Password reset error: " . $e->getMessage());
        sendError('Failed to reset password', 500);
    }
    
} else {
    sendError('Invalid action');
}

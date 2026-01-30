<?php
/**
 * Verify email address
 * GET /api/auth/verify.php?token=xxx
 */

require_once '../config.php';

$token = $_GET['token'] ?? '';

if (empty($token)) {
    sendError('Verification token is required');
}

$db = getDB();

try {
    // Find user with this token
    $stmt = $db->prepare("
        SELECT id, email FROM users 
        WHERE verification_token = :token 
        AND verified_at IS NULL
        LIMIT 1
    ");
    $stmt->execute(['token' => $token]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('Invalid verification token or account already verified', 400);
    }
    
    // Mark as verified
    $stmt = $db->prepare("
        UPDATE users 
        SET verified_at = NOW(), verification_token = NULL 
        WHERE id = :id
    ");
    $stmt->execute(['id' => $user['id']]);
    
    sendResponse([
        'success' => true,
        'message' => 'Email verified successfully! You can now log in.'
    ]);
    
} catch (PDOException $e) {
    error_log("Email verification error: " . $e->getMessage());
    sendError('Verification failed', 500);
}

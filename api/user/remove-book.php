<?php
/**
 * Remove book from user's library
 * DELETE /api/user/remove-book.php?bookId=123
 */

require_once '../config.php';
require_once '../helpers/analytics.php';

$user = requireAuth();

$bookId = (int)($_GET['bookId'] ?? 0);

if ($bookId <= 0) {
    sendError('Invalid book ID');
}

$db = getDB();

try {
    $stmt = $db->prepare("
        DELETE FROM user_books 
        WHERE user_id = :user_id AND book_id = :book_id
    ");
    
    $stmt->execute([
        'user_id' => $user['user_id'],
        'book_id' => $bookId
    ]);
    
    if ($stmt->rowCount() === 0) {
        sendError('Book not in library', 404);
    }
    
    logEvent($user['user_id'], getSessionId(), 'books', 'remove_from_library', [], $bookId);

    sendResponse([
        'success' => true,
        'message' => 'Book removed from library'
    ]);
    
} catch (PDOException $e) {
    error_log("Remove book error: " . $e->getMessage());
    sendError('Failed to remove book', 500);
}

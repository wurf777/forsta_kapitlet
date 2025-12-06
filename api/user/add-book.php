<?php
/**
 * Add book to user's library
 * POST /api/user/add-book.php
 */

require_once '../config.php';

$user = requireAuth();
$data = getJsonInput();

if (!$data) {
    sendError('Invalid JSON data');
}

// Validate required fields
if (empty($data['bookId'])) {
    sendError('Book ID is required');
}

$db = getDB();

try {
    $db->beginTransaction();
    
    $bookId = (int)$data['bookId'];
    
    // Check if book exists
    $stmt = $db->prepare("SELECT id FROM books WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $bookId]);
    $book = $stmt->fetch();
    
    if (!$book) {
        sendError('Book not found', 404);
    }
    
    // Check if already in user's library
    $stmt = $db->prepare("
        SELECT id FROM user_books 
        WHERE user_id = :user_id AND book_id = :book_id 
        LIMIT 1
    ");
    $stmt->execute([
        'user_id' => $user['user_id'],
        'book_id' => $bookId
    ]);
    
    if ($stmt->fetch()) {
        sendError('Book already in library', 409);
    }
    
    // Add to user's library
    $stmt = $db->prepare("
        INSERT INTO user_books (user_id, book_id, status, rating, progress, notes) 
        VALUES (:user_id, :book_id, :status, :rating, :progress, :notes)
    ");
    
    $stmt->execute([
        'user_id' => $user['user_id'],
        'book_id' => $bookId,
        'status' => sanitize($data['status'] ?? 'Vill läsa'),
        'rating' => (int)($data['rating'] ?? 0),
        'progress' => (int)($data['progress'] ?? 0),
        'notes' => sanitize($data['notes'] ?? '')
    ]);
    
    $db->commit();
    
    sendResponse([
        'success' => true,
        'message' => 'Book added to library'
    ], 201);
    
} catch (PDOException $e) {
    $db->rollBack();
    error_log("Add book error: " . $e->getMessage());
    sendError('Failed to add book', 500);
}

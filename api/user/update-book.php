<?php
/**
 * Update book status/rating/notes in user's library
 * PUT /api/user/update-book.php
 */

require_once '../config.php';

$user = requireAuth();
$data = getJsonInput();

if (!$data) {
    sendError('Invalid JSON data');
}

if (empty($data['bookId'])) {
    sendError('Book ID is required');
}

$db = getDB();

try {
    $bookId = (int)$data['bookId'];
    
    // Check if book is in user's library
    $stmt = $db->prepare("
        SELECT id FROM user_books 
        WHERE user_id = :user_id AND book_id = :book_id 
        LIMIT 1
    ");
    $stmt->execute([
        'user_id' => $user['user_id'],
        'book_id' => $bookId
    ]);
    
    if (!$stmt->fetch()) {
        sendError('Book not in library', 404);
    }
    
    // Update book
    $updateFields = [];
    $updateParams = [
        'user_id' => $user['user_id'],
        'book_id' => $bookId
    ];
    
    if (isset($data['status'])) {
        $updateFields[] = "status = :status";
        $updateParams['status'] = sanitize($data['status']);
    }
    
    if (isset($data['rating'])) {
        $updateFields[] = "rating = :rating";
        $updateParams['rating'] = (int)$data['rating'];
    }
    
    if (isset($data['progress'])) {
        $updateFields[] = "progress = :progress";
        $updateParams['progress'] = (int)$data['progress'];
    }
    
    if (isset($data['notes'])) {
        $updateFields[] = "notes = :notes";
        $updateParams['notes'] = sanitize($data['notes']);
    }
    
    // Update timestamps based on status
    if (isset($data['status'])) {
        if ($data['status'] === 'Läser' && !isset($data['startedAt'])) {
            $updateFields[] = "started_at = NOW()";
        } elseif ($data['status'] === 'Läst' && !isset($data['finishedAt'])) {
            $updateFields[] = "finished_at = NOW()";
        }
    }
    
    if (empty($updateFields)) {
        sendError('No fields to update');
    }
    
    $sql = "UPDATE user_books SET " . implode(', ', $updateFields) . " 
            WHERE user_id = :user_id AND book_id = :book_id";
    
    $stmt = $db->prepare($sql);
    $stmt->execute($updateParams);
    
    sendResponse([
        'success' => true,
        'message' => 'Book updated'
    ]);
    
} catch (PDOException $e) {
    error_log("Update book error: " . $e->getMessage());
    sendError('Failed to update book', 500);
}

<?php
/**
 * Admin: Update book core data
 * PUT /api/books/update.php
 */

require_once '../config.php';

$user = requireAdmin();
$data = getJsonInput();

if (!$data) {
    sendError('Invalid JSON data');
}

if (empty($data['id'])) {
    sendError('Book ID is required');
}

$db = getDB();

try {
    $bookId = (int)$data['id'];

    // Verify book exists
    $stmt = $db->prepare("SELECT id FROM books WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $bookId]);
    if (!$stmt->fetch()) {
        sendError('Book not found', 404);
    }

    $updateFields = [];
    $updateParams = ['id' => $bookId];

    $allowedFields = [
        'title' => 'string',
        'subtitle' => 'string',
        'description' => 'string',
        'publisher' => 'string',
        'published_date' => 'string',
        'page_count' => 'int',
        'language' => 'string',
        'cover_url' => 'string',
        'isbn_13' => 'string',
        'isbn_10' => 'string',
    ];

    foreach ($allowedFields as $field => $type) {
        if (isset($data[$field])) {
            $value = $data[$field];

            // Convert year-only dates (e.g. "2008") to proper DATE format
            if ($field === 'published_date' && preg_match('/^\d{4}$/', $value)) {
                $value = $value . '-01-01';
            }

            $updateFields[] = "$field = :$field";
            if ($type === 'int') {
                $updateParams[$field] = (int)$value;
            } else {
                $updateParams[$field] = $field === 'cover_url'
                    ? sanitizeUrl($value)
                    : sanitize($value);
            }
        }
    }

    if (empty($updateFields)) {
        sendError('No fields to update');
    }

    // Recalculate data_quality_score
    // Merge existing book data with incoming updates for score calculation
    $stmt = $db->prepare("SELECT * FROM books WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $bookId]);
    $existingBook = $stmt->fetch();

    $merged = array_merge($existingBook, array_intersect_key($data, $allowedFields));
    // Map field names for calculateQualityScore
    $scoreInput = [
        'title' => $merged['title'] ?? '',
        'authors' => $merged['author_name'] ?? $existingBook['title'], // just need non-empty check
        'cover_url' => $merged['cover_url'] ?? '',
        'description' => $merged['description'] ?? '',
        'isbn_13' => $merged['isbn_13'] ?? '',
        'isbn_10' => $merged['isbn_10'] ?? '',
        'page_count' => $merged['page_count'] ?? 0,
        'published_date' => $merged['published_date'] ?? '',
    ];

    // Check if book has authors
    $authorStmt = $db->prepare("SELECT COUNT(*) as cnt FROM book_authors WHERE book_id = :id");
    $authorStmt->execute(['id' => $bookId]);
    $authorCount = $authorStmt->fetch()['cnt'];
    if ($authorCount > 0) {
        $scoreInput['authors'] = 'has_authors';
    } else {
        $scoreInput['authors'] = '';
    }

    $qualityScore = calculateQualityScore($scoreInput);
    $updateFields[] = "data_quality_score = :data_quality_score";
    $updateParams['data_quality_score'] = $qualityScore;

    $sql = "UPDATE books SET " . implode(', ', $updateFields) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($updateParams);

    // Fetch updated book
    $stmt = $db->prepare("SELECT * FROM books WHERE id = :id LIMIT 1");
    $stmt->execute(['id' => $bookId]);
    $updatedBook = $stmt->fetch();

    sendResponse([
        'success' => true,
        'message' => 'Book updated',
        'book' => $updatedBook
    ]);

} catch (PDOException $e) {
    error_log("Admin update book error: " . $e->getMessage());
    sendError('Failed to update book', 500);
}

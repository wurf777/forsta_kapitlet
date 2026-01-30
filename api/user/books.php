<?php
/**
 * Get user's books
 * GET /api/user/books.php
 */

require_once '../config.php';

$user = requireAuth();

$db = getDB();

try {
    $sql = "
        SELECT 
            b.*,
            ub.status,
            ub.rating,
            ub.progress,
            ub.notes,
            ub.started_at,
            ub.finished_at,
            GROUP_CONCAT(DISTINCT a.name ORDER BY ba.author_order SEPARATOR ', ') as authors,
            GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') as genres
        FROM user_books ub
        JOIN books b ON ub.book_id = b.id
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        LEFT JOIN book_genres bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE ub.user_id = :user_id
        GROUP BY b.id, ub.id
        ORDER BY ub.created_at DESC
    ";
    
    $stmt = $db->prepare($sql);
    $stmt->execute(['user_id' => $user['user_id']]);
    $books = $stmt->fetchAll();
    
    // Format response
    $formattedBooks = array_map(function($book) {
        return [
            'id' => $book['google_books_id'] ?: 'db_' . $book['id'], // Use google_books_id or database ID
            'dbId' => (int)$book['id'],
            'googleBooksId' => $book['google_books_id'],
            'title' => $book['title'],
            'subtitle' => $book['subtitle'],
            'author' => $book['authors'] ?? 'Okänd författare',
            'authors' => $book['authors'] ? explode(', ', $book['authors']) : [],
            'cover' => html_entity_decode($book['cover_url'], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'coverThumbnail' => html_entity_decode($book['cover_thumbnail_url'], ENT_QUOTES | ENT_HTML5, 'UTF-8'),
            'isbn' => $book['isbn_13'] ?? $book['isbn_10'],
            'pages' => (int)$book['page_count'],
            'published' => $book['published_date'] ? substr($book['published_date'], 0, 4) : 'Okänt år',
            'synopsis' => $book['description'] ?? 'Ingen beskrivning tillgänglig.',
            'categories' => $book['genres'] ? explode(', ', $book['genres']) : [],
            'language' => $book['language'],
            'publisher' => $book['publisher'],
            // User-specific data
            'status' => $book['status'],
            'rating' => (int)$book['rating'],
            'progress' => (int)$book['progress'],
            'notes' => $book['notes'],
            'startedAt' => $book['started_at'],
            'finishedAt' => $book['finished_at'],
            // AI metadata
            'aiVibe' => $book['ai_vibe'],
            'aiTempo' => $book['ai_tempo'],
            'aiSummary' => $book['ai_summary'],
            // Source for badges - in library view, everything is served from DB
            'source' => 'db',
        ];
    }, $books);
    
    sendResponse($formattedBooks);
    
} catch (PDOException $e) {
    error_log("Get user books error: " . $e->getMessage());
    sendError('Failed to get books', 500);
}

<?php
/**
 * Get a single book by ID
 * GET /api/books/get.php?id=123
 */

require_once '../config.php';

$bookId = (int)($_GET['id'] ?? 0);

if ($bookId <= 0) {
    sendError('Invalid book ID');
}

$db = getDB();

try {
    $stmt = $db->prepare("
        SELECT 
            b.*,
            GROUP_CONCAT(DISTINCT a.name ORDER BY ba.author_order SEPARATOR ', ') as authors,
            GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') as genres
        FROM books b
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        LEFT JOIN book_genres bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE b.id = :id
        GROUP BY b.id
    ");
    
    $stmt->execute(['id' => $bookId]);
    $book = $stmt->fetch();
    
    if (!$book) {
        sendError('Book not found', 404);
    }
    
    // Format response
    $response = [
        'id' => (int)$book['id'],
        'googleBooksId' => $book['google_books_id'],
        'title' => $book['title'],
        'subtitle' => $book['subtitle'],
        'author' => $book['authors'] ?? 'Okänd författare',
        'authors' => $book['authors'] ? explode(', ', $book['authors']) : [],
        'cover' => $book['cover_url'],
        'coverThumbnail' => $book['cover_thumbnail_url'],
        'isbn' => $book['isbn_13'] ?? $book['isbn_10'],
        'pages' => (int)$book['page_count'],
        'published' => $book['published_date'] ? substr($book['published_date'], 0, 4) : 'Okänt år',
        'synopsis' => $book['description'] ?? 'Ingen beskrivning tillgänglig.',
        'categories' => $book['genres'] ? explode(', ', $book['genres']) : [],
        'language' => $book['language'],
        'publisher' => $book['publisher'],
        'aiVibe' => $book['ai_vibe'],
        'aiTempo' => $book['ai_tempo'],
        'aiThemes' => $book['ai_themes'] ? json_decode($book['ai_themes']) : [],
        'aiSummary' => $book['ai_summary'],
        'dataQualityScore' => (int)$book['data_quality_score'],
        'source' => $book['source']
    ];
    
    sendResponse($response);
    
} catch (PDOException $e) {
    error_log("Get book error: " . $e->getMessage());
    sendError('Failed to get book', 500);
}

<?php
/**
 * Search books in local database
 * GET /api/books/search.php?q=query&limit=10&offset=0
 */

require_once '../config.php';

// Get search parameters
$query = $_GET['q'] ?? '';
$limit = min((int)($_GET['limit'] ?? 10), 50); // Max 50 results
$offset = max((int)($_GET['offset'] ?? 0), 0);

if (empty($query)) {
    sendResponse([]);
}

$db = getDB();

try {
    // Simple LIKE-based search (works without FULLTEXT index)
    $sql = "
        SELECT DISTINCT
            b.*,
            GROUP_CONCAT(DISTINCT a.name ORDER BY ba.author_order SEPARATOR ', ') as authors,
            GROUP_CONCAT(DISTINCT g.name SEPARATOR ', ') as genres
        FROM books b
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        LEFT JOIN book_genres bg ON b.id = bg.book_id
        LEFT JOIN genres g ON bg.genre_id = g.id
        WHERE 
            b.title LIKE ?
            OR b.description LIKE ?
            OR a.name LIKE ?
            OR b.isbn_13 = ?
            OR b.isbn_10 = ?
        GROUP BY b.id
        ORDER BY 
            CASE 
                WHEN b.title = ? THEN 1
                WHEN b.title LIKE ? THEN 2
                ELSE 3
            END,
            b.data_quality_score DESC,
            b.created_at DESC
        LIMIT ? OFFSET ?
    ";
    
    $queryLike = "%$query%";
    $stmt = $db->prepare($sql);
    $stmt->execute([
        $queryLike,      // b.title LIKE
        $queryLike,      // b.description LIKE
        $queryLike,      // a.name LIKE
        $query,          // b.isbn_13 =
        $query,          // b.isbn_10 =
        $query,          // WHEN b.title =
        $queryLike,      // WHEN b.title LIKE
        $limit,          // LIMIT
        $offset          // OFFSET
    ]);
    
    $books = $stmt->fetchAll();
    
    // Format response
    $formattedBooks = array_map(function($book) {
        return [
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
    }, $books);
    
    sendResponse($formattedBooks);
    
} catch (PDOException $e) {
    error_log("Search error: " . $e->getMessage());
    sendError('Search failed', 500);
}

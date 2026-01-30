<?php
/**
 * Create or update a book in the database
 * POST /api/books/create.php
 */

require_once '../config.php';

$data = getJsonInput();

if (!$data) {
    sendError('Invalid JSON data');
}

// Validate required fields
if (empty($data['title'])) {
    sendError('Title is required');
}

$db = getDB();

try {
    $db->beginTransaction();
    
    // Check if book already exists (by Google Books ID or ISBN)
    $existingBook = null;
    
    if (!empty($data['googleBooksId'])) {
        $stmt = $db->prepare("SELECT id FROM books WHERE google_books_id = :gid LIMIT 1");
        $stmt->execute(['gid' => $data['googleBooksId']]);
        $existingBook = $stmt->fetch();
    }
    
    if (!$existingBook && !empty($data['isbn'])) {
        $stmt = $db->prepare("SELECT id FROM books WHERE isbn_13 = :isbn1 OR isbn_10 = :isbn2 LIMIT 1");
        $stmt->execute(['isbn1' => $data['isbn'], 'isbn2' => $data['isbn']]);
        $existingBook = $stmt->fetch();
    }
    
    // Prepare book data
    $bookData = [
        'google_books_id' => $data['googleBooksId'] ?? null,
        'isbn_13' => (strlen($data['isbn'] ?? '') === 13) ? $data['isbn'] : null,
        'isbn_10' => (strlen($data['isbn'] ?? '') === 10) ? $data['isbn'] : null,
        'title' => sanitize($data['title']),
        'subtitle' => sanitize($data['subtitle'] ?? null),
        'publisher' => sanitize($data['publisher'] ?? null),
        'published_date' => $data['publishedDate'] ?? null,
        'page_count' => (int)($data['pages'] ?? 0),
        'language' => sanitize($data['language'] ?? 'sv'),
        'description' => sanitize($data['synopsis'] ?? $data['description'] ?? null),
        'cover_url' => sanitizeUrl($data['cover'] ?? null),
        'cover_thumbnail_url' => sanitizeUrl($data['coverThumbnail'] ?? $data['cover'] ?? null),
        'source' => sanitize($data['source'] ?? 'google_books'),
        'data_quality_score' => calculateQualityScore($data)
    ];
    
    if ($existingBook) {
        // Update existing book (only if new data has better quality score)
        $stmt = $db->prepare("SELECT data_quality_score FROM books WHERE id = :id");
        $stmt->execute(['id' => $existingBook['id']]);
        $currentScore = $stmt->fetchColumn();
        
        if ($bookData['data_quality_score'] > $currentScore) {
            $updateFields = [];
            $updateParams = ['id' => $existingBook['id']];
            
            foreach ($bookData as $key => $value) {
                if ($value !== null) {
                    $updateFields[] = "$key = :$key";
                    $updateParams[$key] = $value;
                }
            }
            
            if (!empty($updateFields)) {
                $sql = "UPDATE books SET " . implode(', ', $updateFields) . " WHERE id = :id";
                $stmt = $db->prepare($sql);
                $stmt->execute($updateParams);
            }
        }
        
        $bookId = $existingBook['id'];
    } else {
        // Insert new book
        $fields = array_keys($bookData);
        $placeholders = array_map(fn($f) => ":$f", $fields);
        
        $sql = "INSERT INTO books (" . implode(', ', $fields) . ") 
                VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($bookData);
        $bookId = $db->lastInsertId();
    }
    
    // Handle authors
    if (!empty($data['authors']) || !empty($data['author'])) {
        $authors = [];
        
        if (!empty($data['authors']) && is_array($data['authors'])) {
            $authors = $data['authors'];
        } elseif (!empty($data['author'])) {
            $authors = explode(', ', $data['author']);
        }
        
        // Clear existing authors for this book
        $stmt = $db->prepare("DELETE FROM book_authors WHERE book_id = :book_id");
        $stmt->execute(['book_id' => $bookId]);
        
        foreach ($authors as $index => $authorName) {
            $authorName = sanitize(trim($authorName));
            if (empty($authorName)) continue;
            
            // Get or create author
            $stmt = $db->prepare("SELECT id FROM authors WHERE name = :name LIMIT 1");
            $stmt->execute(['name' => $authorName]);
            $author = $stmt->fetch();
            
            if (!$author) {
                $stmt = $db->prepare("INSERT INTO authors (name) VALUES (:name)");
                $stmt->execute(['name' => $authorName]);
                $authorId = $db->lastInsertId();
            } else {
                $authorId = $author['id'];
            }
            
            // Link author to book
            $stmt = $db->prepare("
                INSERT INTO book_authors (book_id, author_id, author_order) 
                VALUES (:book_id, :author_id, :order)
            ");
            $stmt->execute([
                'book_id' => $bookId,
                'author_id' => $authorId,
                'order' => $index + 1
            ]);
        }
    }
    
    // Handle genres/categories
    if (!empty($data['categories']) && is_array($data['categories'])) {
        // Clear existing genres for this book
        $stmt = $db->prepare("DELETE FROM book_genres WHERE book_id = :book_id");
        $stmt->execute(['book_id' => $bookId]);
        
        foreach ($data['categories'] as $genreName) {
            $genreName = sanitize(trim($genreName));
            if (empty($genreName)) continue;
            
            // Get or create genre
            $stmt = $db->prepare("SELECT id FROM genres WHERE name = :name LIMIT 1");
            $stmt->execute(['name' => $genreName]);
            $genre = $stmt->fetch();
            
            if (!$genre) {
                $stmt = $db->prepare("INSERT INTO genres (name) VALUES (:name)");
                $stmt->execute(['name' => $genreName]);
                $genreId = $db->lastInsertId();
            } else {
                $genreId = $genre['id'];
            }
            
            // Link genre to book
            $stmt = $db->prepare("
                INSERT IGNORE INTO book_genres (book_id, genre_id) 
                VALUES (:book_id, :genre_id)
            ");
            $stmt->execute([
                'book_id' => $bookId,
                'genre_id' => $genreId
            ]);
        }
    }
    
    $db->commit();
    
    // Return the created/updated book
    $stmt = $db->prepare("
        SELECT b.*, 
               GROUP_CONCAT(DISTINCT a.name ORDER BY ba.author_order SEPARATOR ', ') as authors
        FROM books b
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        WHERE b.id = :id
        GROUP BY b.id
    ");
    $stmt->execute(['id' => $bookId]);
    $book = $stmt->fetch();
    
    sendResponse([
        'success' => true,
        'book' => [
            'id' => (int)$book['id'],
            'title' => $book['title'],
            'author' => $book['authors'] ?? 'Okänd författare'
        ]
    ], 201);
    
} catch (PDOException $e) {
    $db->rollBack();
    error_log("Create book error: " . $e->getMessage());
    sendError('Failed to create book', 500);
}

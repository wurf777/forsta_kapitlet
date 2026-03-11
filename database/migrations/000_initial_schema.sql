-- ============================================
-- Bokdatabas Schema för one.com MySQL
-- Migration 000 - Grundschema
-- ============================================

-- Böcker (huvudtabell)
CREATE TABLE IF NOT EXISTS books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    google_books_id VARCHAR(255) UNIQUE,
    isbn_13 VARCHAR(13),
    isbn_10 VARCHAR(10),
    title VARCHAR(500) NOT NULL,
    subtitle VARCHAR(500),
    publisher VARCHAR(255),
    published_date DATE,
    page_count INT,
    language VARCHAR(10) DEFAULT 'sv',
    description TEXT,
    cover_url VARCHAR(1000),
    cover_thumbnail_url VARCHAR(1000),

    -- AI-genererade fält
    ai_vibe VARCHAR(255),
    ai_tempo VARCHAR(50),
    ai_themes JSON,
    ai_summary TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    source VARCHAR(50) DEFAULT 'google_books',
    data_quality_score INT DEFAULT 0,

    INDEX idx_title (title(100)),
    INDEX idx_isbn13 (isbn_13),
    INDEX idx_isbn10 (isbn_10),
    INDEX idx_google_id (google_books_id),
    INDEX idx_language (language),
    INDEX idx_quality (data_quality_score),
    FULLTEXT INDEX ft_title_desc (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Författare
CREATE TABLE IF NOT EXISTS authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    bio TEXT,
    image_url VARCHAR(1000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Koppling mellan böcker och författare
CREATE TABLE IF NOT EXISTS book_authors (
    book_id INT NOT NULL,
    author_id INT NOT NULL,
    author_order INT DEFAULT 1,
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE CASCADE,

    INDEX idx_book (book_id),
    INDEX idx_author (author_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Genrer/Kategorier
CREATE TABLE IF NOT EXISTS genres (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    parent_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (parent_id) REFERENCES genres(id) ON DELETE SET NULL,
    INDEX idx_name (name),
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Koppling mellan böcker och genrer
CREATE TABLE IF NOT EXISTS book_genres (
    book_id INT NOT NULL,
    genre_id INT NOT NULL,
    PRIMARY KEY (book_id, genre_id),
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,

    INDEX idx_book (book_id),
    INDEX idx_genre (genre_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Användare
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    verification_token VARCHAR(64),
    verified_at TIMESTAMP NULL,
    reset_token VARCHAR(64),
    reset_token_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_verification (verification_token),
    INDEX idx_reset (reset_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Användarnas böcker (personliga listor)
CREATE TABLE IF NOT EXISTS user_books (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    book_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Vill läsa',
    rating INT DEFAULT 0,
    progress INT DEFAULT 0,
    notes TEXT,
    started_at TIMESTAMP NULL,
    finished_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_book (user_id, book_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_book (book_id),
    INDEX idx_status (status),
    INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Användarnas profiler (favoriter, blocklist)
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id INT PRIMARY KEY,
    favorite_authors JSON,
    favorite_genres JSON,
    blocked_authors JSON,
    blocked_genres JSON,
    preferences JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datakällor (för att spåra var data kommer ifrån)
CREATE TABLE IF NOT EXISTS data_sources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    source_name VARCHAR(50) NOT NULL,
    source_id VARCHAR(255),
    last_synced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    raw_data JSON,

    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    INDEX idx_book (book_id),
    INDEX idx_source (source_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed några vanliga genrer
INSERT IGNORE INTO genres (name) VALUES
    ('Deckare'),
    ('Fantasy'),
    ('Science Fiction'),
    ('Romantik'),
    ('Thriller'),
    ('Historisk'),
    ('Biografi'),
    ('Klassiker'),
    ('Barn & Ungdom'),
    ('Skräck'),
    ('Humor'),
    ('Poesi'),
    ('Drama'),
    ('Äventyr');

INSERT IGNORE INTO schema_migrations (version) VALUES ('000_initial_schema');

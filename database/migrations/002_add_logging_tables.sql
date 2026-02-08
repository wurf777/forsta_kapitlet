-- ============================================
-- Logging & Analytics Schema
-- Migration 002
-- ============================================

CREATE TABLE IF NOT EXISTS log_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_hash VARCHAR(64) NOT NULL,
    session_id VARCHAR(64) NOT NULL,
    event_category ENUM('auth', 'books', 'search', 'bibbi', 'profile') NOT NULL,
    event_action VARCHAR(100) NOT NULL,
    event_data JSON,
    book_id INT DEFAULT NULL,
    search_query VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_hash (user_hash),
    INDEX idx_session (session_id),
    INDEX idx_category (event_category),
    INDEX idx_action (event_action),
    INDEX idx_created_at (created_at),
    INDEX idx_book_id (book_id),
    INDEX idx_category_created (event_category, created_at),
    INDEX idx_user_created (user_hash, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS log_sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64) NOT NULL UNIQUE,
    user_hash VARCHAR(64) NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    had_bibbi_chat BOOLEAN DEFAULT FALSE,
    had_bibbi_recommendations BOOLEAN DEFAULT FALSE,
    had_book_add BOOLEAN DEFAULT FALSE,

    INDEX idx_session_user (user_hash),
    INDEX idx_session_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

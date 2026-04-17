-- Migration 003: Rate limits table + analytics performance indexes
-- Run this migration after 002_add_logging_tables.sql

-- Rate limits table for brute-force protection on auth endpoints
CREATE TABLE IF NOT EXISTS rate_limits (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL COMMENT 'IP address or email',
    action     VARCHAR(50)  NOT NULL COMMENT 'login | register | reset',
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rate_lookup (identifier, action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Analytics performance indexes (skipped — already created in 002 migration)

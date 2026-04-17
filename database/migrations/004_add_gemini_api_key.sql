-- Migration 004: Lägg till gemini_api_key i user_profiles
-- Kör mot befintlig databas via phpMyAdmin eller MySQL-klienten

ALTER TABLE user_profiles
    ADD COLUMN gemini_api_key VARCHAR(500) NULL AFTER preferences;

INSERT IGNORE INTO schema_migrations (version)
    VALUES ('004_add_gemini_api_key_to_user_profiles');

ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0;

INSERT IGNORE INTO schema_migrations (version) VALUES ('001_add_is_admin_to_users');

#!/bin/sh
mysql -u forsta_user -pforsta_password forsta_kapitlet_db -e "SHOW TABLES LIKE 'rate_limits'; SHOW INDEX FROM log_events WHERE Key_name IN ('idx_book_id_events','idx_user_hash_events'); SHOW INDEX FROM log_sessions WHERE Key_name = 'idx_user_hash_sessions';" 2>/dev/null

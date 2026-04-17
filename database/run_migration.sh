#!/bin/sh
mysql -u forsta_user -pforsta_password forsta_kapitlet_db < /docker-entrypoint-initdb.d/migrations/003_add_rate_limits_and_analytics_indexes.sql && echo "Migration OK" || echo "Migration FAILED"

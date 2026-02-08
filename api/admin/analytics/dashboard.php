<?php
/**
 * Analytics Dashboard Data API
 * GET /api/admin/analytics/dashboard.php?section=<section>&from=<date>&to=<date>
 *
 * Sections: overview, users, user_timeline, books, bibbi
 * Requires admin authentication.
 */

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../helpers/analytics.php';

$user = requireAdmin();

$section = $_GET['section'] ?? 'overview';
$from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
$to = $_GET['to'] ?? date('Y-m-d');
$userHash = $_GET['user_hash'] ?? null;

// Ensure "to" includes the full day
$toEnd = $to . ' 23:59:59';

$db = getDB();

switch ($section) {
    case 'overview':
        handleOverview($db, $from, $toEnd);
        break;
    case 'users':
        handleUsers($db, $from, $toEnd);
        break;
    case 'user_timeline':
        handleUserTimeline($db, $from, $toEnd, $userHash);
        break;
    case 'books':
        handleBooks($db, $from, $toEnd);
        break;
    case 'bibbi':
        handleBibbi($db, $from, $toEnd);
        break;
    default:
        sendError('Invalid section');
}

function handleOverview($db, $from, $to) {
    // Active users for different periods
    $periods = [
        'today' => 'INTERVAL 1 DAY',
        'week' => 'INTERVAL 7 DAY',
        'month' => 'INTERVAL 30 DAY',
    ];

    $activeUsers = [];
    foreach ($periods as $key => $interval) {
        $stmt = $db->prepare("SELECT COUNT(DISTINCT user_hash) as count FROM log_events WHERE created_at >= DATE_SUB(NOW(), $interval)");
        $stmt->execute();
        $activeUsers[$key] = (int)$stmt->fetch()['count'];
    }

    // Feature frequency
    $stmt = $db->prepare("
        SELECT event_category, COUNT(*) as count
        FROM log_events
        WHERE created_at BETWEEN :from AND :to
        GROUP BY event_category
        ORDER BY count DESC
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $featureFrequency = $stmt->fetchAll();

    // Activity trend (per day)
    $stmt = $db->prepare("
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM log_events
        WHERE created_at BETWEEN :from AND :to
        GROUP BY DATE(created_at)
        ORDER BY date
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $activityTrend = $stmt->fetchAll();

    // Top actions breakdown
    $stmt = $db->prepare("
        SELECT event_category, event_action, COUNT(*) as count
        FROM log_events
        WHERE created_at BETWEEN :from AND :to
        GROUP BY event_category, event_action
        ORDER BY count DESC
        LIMIT 20
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $topActions = $stmt->fetchAll();

    sendResponse([
        'active_users' => $activeUsers,
        'feature_frequency' => $featureFrequency,
        'activity_trend' => $activityTrend,
        'top_actions' => $topActions,
    ]);
}

function handleUsers($db, $from, $to) {
    $stmt = $db->prepare("
        SELECT
            user_hash,
            MIN(created_at) as first_seen,
            MAX(created_at) as last_active,
            COUNT(*) as total_events,
            (
                SELECT e2.event_category
                FROM log_events e2
                WHERE e2.user_hash = e.user_hash
                GROUP BY e2.event_category
                ORDER BY COUNT(*) DESC
                LIMIT 1
            ) as top_category
        FROM log_events e
        WHERE created_at BETWEEN :from AND :to
        GROUP BY user_hash
        ORDER BY last_active DESC
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $users = $stmt->fetchAll();

    // Assign labels (User-A, User-B, etc.) by first_seen order
    usort($users, fn($a, $b) => strcmp($a['first_seen'], $b['first_seen']));
    foreach ($users as $i => &$u) {
        $u['label'] = 'Användare ' . chr(65 + $i); // A, B, C...
        $u['total_events'] = (int)$u['total_events'];
    }
    // Re-sort by last_active desc
    usort($users, fn($a, $b) => strcmp($b['last_active'], $a['last_active']));

    sendResponse(['users' => $users]);
}

function handleUserTimeline($db, $from, $to, $userHash) {
    if (!$userHash) {
        sendError('user_hash parameter required');
    }

    // Events
    $stmt = $db->prepare("
        SELECT id, event_category, event_action, event_data, book_id, search_query, created_at
        FROM log_events
        WHERE user_hash = :user_hash AND created_at BETWEEN :from AND :to
        ORDER BY created_at DESC
        LIMIT 500
    ");
    $stmt->execute(['user_hash' => $userHash, 'from' => $from, 'to' => $to]);
    $events = $stmt->fetchAll();

    // Parse JSON event_data
    foreach ($events as &$event) {
        $event['event_data'] = json_decode($event['event_data'], true);
        $event['id'] = (int)$event['id'];
        $event['book_id'] = $event['book_id'] ? (int)$event['book_id'] : null;
    }

    // Feature breakdown
    $stmt = $db->prepare("
        SELECT event_category, COUNT(*) as count
        FROM log_events
        WHERE user_hash = :user_hash AND created_at BETWEEN :from AND :to
        GROUP BY event_category
        ORDER BY count DESC
    ");
    $stmt->execute(['user_hash' => $userHash, 'from' => $from, 'to' => $to]);
    $breakdown = $stmt->fetchAll();

    // User meta
    $stmt = $db->prepare("
        SELECT MIN(created_at) as first_seen, MAX(created_at) as last_active, COUNT(*) as total_events
        FROM log_events
        WHERE user_hash = :user_hash
    ");
    $stmt->execute(['user_hash' => $userHash]);
    $meta = $stmt->fetch();

    sendResponse([
        'user_hash' => $userHash,
        'first_seen' => $meta['first_seen'],
        'last_active' => $meta['last_active'],
        'total_events' => (int)$meta['total_events'],
        'events' => $events,
        'feature_breakdown' => $breakdown,
    ]);
}

function handleBooks($db, $from, $to) {
    // Most added books
    $stmt = $db->prepare("
        SELECT
            e.book_id,
            b.title,
            GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author,
            COUNT(*) as add_count
        FROM log_events e
        LEFT JOIN books b ON e.book_id = b.id
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        WHERE e.event_action = 'add_to_library'
          AND e.created_at BETWEEN :from AND :to
          AND e.book_id IS NOT NULL
        GROUP BY e.book_id, b.title
        ORDER BY add_count DESC
        LIMIT 10
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $mostAdded = $stmt->fetchAll();

    // Top search terms
    $stmt = $db->prepare("
        SELECT search_query as term, COUNT(*) as count
        FROM log_events
        WHERE event_action = 'search'
          AND search_query IS NOT NULL
          AND search_query != ''
          AND created_at BETWEEN :from AND :to
        GROUP BY search_query
        ORDER BY count DESC
        LIMIT 10
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $topSearchTerms = $stmt->fetchAll();

    // Rating distribution (from user_books directly)
    $stmt = $db->query("
        SELECT rating, COUNT(*) as count
        FROM user_books
        WHERE rating > 0
        GROUP BY rating
        ORDER BY rating
    ");
    $ratingDistribution = $stmt->fetchAll();

    // Popular authors
    $stmt = $db->prepare("
        SELECT
            a.name as author,
            COUNT(DISTINCT e.book_id) as book_count,
            COUNT(*) as add_count
        FROM log_events e
        JOIN books b ON e.book_id = b.id
        JOIN book_authors ba ON b.id = ba.book_id
        JOIN authors a ON ba.author_id = a.id
        WHERE e.event_action = 'add_to_library'
          AND e.created_at BETWEEN :from AND :to
        GROUP BY a.name
        ORDER BY add_count DESC
        LIMIT 10
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $popularAuthors = $stmt->fetchAll();

    // Read conversion: books added vs books with status 'Läst'
    $stmt = $db->query("
        SELECT
            COUNT(*) as total_in_library,
            SUM(CASE WHEN status = 'Läser' THEN 1 ELSE 0 END) as status_reading,
            SUM(CASE WHEN status = 'Läst' THEN 1 ELSE 0 END) as status_read,
            SUM(CASE WHEN status = 'Vill läsa' THEN 1 ELSE 0 END) as status_want
        FROM user_books
    ");
    $conversion = $stmt->fetch();
    $total = (int)$conversion['total_in_library'];
    $conversion['read_rate_percent'] = $total > 0
        ? round(((int)$conversion['status_read'] / $total) * 100, 1)
        : 0;

    sendResponse([
        'most_added' => $mostAdded,
        'top_search_terms' => $topSearchTerms,
        'rating_distribution' => $ratingDistribution,
        'popular_authors' => $popularAuthors,
        'read_conversion' => $conversion,
    ]);
}

function handleBibbi($db, $from, $to) {
    // Chat and recommendations over time
    $stmt = $db->prepare("
        SELECT
            DATE(created_at) as date,
            SUM(CASE WHEN event_action = 'chat_message' THEN 1 ELSE 0 END) as chat_count,
            SUM(CASE WHEN event_action = 'get_recommendations' THEN 1 ELSE 0 END) as recommendation_count,
            SUM(CASE WHEN event_action = 'daily_tip' THEN 1 ELSE 0 END) as daily_tip_count
        FROM log_events
        WHERE event_category = 'bibbi'
          AND created_at BETWEEN :from AND :to
        GROUP BY DATE(created_at)
        ORDER BY date
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $overTime = $stmt->fetchAll();

    // Preference distribution
    $stmt = $db->prepare("
        SELECT event_data
        FROM log_events
        WHERE event_action = 'preference_change'
          AND created_at BETWEEN :from AND :to
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $prefRows = $stmt->fetchAll();

    $prefDist = ['tempo' => [], 'mood' => [], 'length' => []];
    foreach ($prefRows as $row) {
        $data = json_decode($row['event_data'], true);
        if ($data && isset($data['type']) && isset($data['new_value'])) {
            $type = $data['type'];
            $val = (string)$data['new_value'];
            if (isset($prefDist[$type])) {
                $prefDist[$type][$val] = ($prefDist[$type][$val] ?? 0) + 1;
            }
        }
    }

    // Conversion: sessions with bibbi → sessions with book add
    $stmt = $db->prepare("
        SELECT
            COUNT(*) as total_sessions,
            SUM(CASE WHEN had_bibbi_chat THEN 1 ELSE 0 END) as sessions_with_chat,
            SUM(CASE WHEN had_bibbi_chat AND had_book_add THEN 1 ELSE 0 END) as chat_to_add,
            SUM(CASE WHEN had_bibbi_recommendations THEN 1 ELSE 0 END) as sessions_with_recs,
            SUM(CASE WHEN had_bibbi_recommendations AND had_book_add THEN 1 ELSE 0 END) as recs_to_add
        FROM log_sessions
        WHERE started_at BETWEEN :from AND :to
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);
    $conv = $stmt->fetch();

    $chatSessions = (int)$conv['sessions_with_chat'];
    $recsSessions = (int)$conv['sessions_with_recs'];

    $conversion = [
        'sessions_with_chat' => $chatSessions,
        'chat_to_add' => (int)$conv['chat_to_add'],
        'chat_conversion_percent' => $chatSessions > 0
            ? round(((int)$conv['chat_to_add'] / $chatSessions) * 100, 1) : 0,
        'sessions_with_recs' => $recsSessions,
        'recs_to_add' => (int)$conv['recs_to_add'],
        'recs_conversion_percent' => $recsSessions > 0
            ? round(((int)$conv['recs_to_add'] / $recsSessions) * 100, 1) : 0,
    ];

    sendResponse([
        'over_time' => $overTime,
        'preference_distribution' => $prefDist,
        'conversion' => $conversion,
    ]);
}

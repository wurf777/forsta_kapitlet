<?php
/**
 * Analytics CSV Export
 * GET /api/admin/analytics/export.php?section=<section>&from=<date>&to=<date>
 *
 * Requires admin authentication.
 */

require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../../helpers/analytics.php';

$user = requireAdmin();

$section = $_GET['section'] ?? 'events';
$from = $_GET['from'] ?? date('Y-m-d', strtotime('-30 days'));
$to = $_GET['to'] ?? date('Y-m-d');
$toEnd = $to . ' 23:59:59';
$userHash = $_GET['user_hash'] ?? null;

$db = getDB();

$filename = "analytics_{$section}_{$from}_to_{$to}.csv";

header('Content-Type: text/csv; charset=utf-8');
header("Content-Disposition: attachment; filename=\"$filename\"");

$output = fopen('php://output', 'w');
// UTF-8 BOM for Excel compatibility
fprintf($output, chr(0xEF) . chr(0xBB) . chr(0xBF));

switch ($section) {
    case 'events':
        exportEvents($db, $output, $from, $toEnd, $userHash);
        break;
    case 'feature_frequency':
        exportFeatureFrequency($db, $output, $from, $toEnd);
        break;
    case 'books':
        exportBooks($db, $output, $from, $toEnd);
        break;
    case 'users':
        exportUsers($db, $output, $from, $toEnd);
        break;
    default:
        exportEvents($db, $output, $from, $toEnd, $userHash);
}

fclose($output);
exit();

function exportEvents($db, $output, $from, $to, $userHash) {
    fputcsv($output, ['Datum', 'Användare', 'Kategori', 'Händelse', 'Data', 'Bok-ID', 'Sökterm']);

    $sql = "SELECT user_hash, event_category, event_action, event_data, book_id, search_query, created_at
            FROM log_events WHERE created_at BETWEEN :from AND :to";
    $params = ['from' => $from, 'to' => $to];

    if ($userHash) {
        $sql .= " AND user_hash = :user_hash";
        $params['user_hash'] = $userHash;
    }
    $sql .= " ORDER BY created_at DESC";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);

    // Build label map
    $labels = getUserLabels($db);

    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            $row['created_at'],
            $labels[$row['user_hash']] ?? $row['user_hash'],
            $row['event_category'],
            $row['event_action'],
            $row['event_data'],
            $row['book_id'],
            $row['search_query'],
        ]);
    }
}

function exportFeatureFrequency($db, $output, $from, $to) {
    fputcsv($output, ['Kategori', 'Händelse', 'Antal']);

    $stmt = $db->prepare("
        SELECT event_category, event_action, COUNT(*) as count
        FROM log_events
        WHERE created_at BETWEEN :from AND :to
        GROUP BY event_category, event_action
        ORDER BY count DESC
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);

    while ($row = $stmt->fetch()) {
        fputcsv($output, [$row['event_category'], $row['event_action'], $row['count']]);
    }
}

function exportBooks($db, $output, $from, $to) {
    fputcsv($output, ['Bok', 'Författare', 'Antal tillagda']);

    $stmt = $db->prepare("
        SELECT b.title, GROUP_CONCAT(DISTINCT a.name SEPARATOR ', ') as author, COUNT(*) as add_count
        FROM log_events e
        LEFT JOIN books b ON e.book_id = b.id
        LEFT JOIN book_authors ba ON b.id = ba.book_id
        LEFT JOIN authors a ON ba.author_id = a.id
        WHERE e.event_action = 'add_to_library'
          AND e.created_at BETWEEN :from AND :to
          AND e.book_id IS NOT NULL
        GROUP BY e.book_id, b.title
        ORDER BY add_count DESC
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);

    while ($row = $stmt->fetch()) {
        fputcsv($output, [$row['title'], $row['author'], $row['add_count']]);
    }
}

function exportUsers($db, $output, $from, $to) {
    fputcsv($output, ['Användare', 'Först sedd', 'Senast aktiv', 'Totalt händelser', 'Mest använd funktion']);

    $stmt = $db->prepare("
        SELECT
            user_hash,
            MIN(created_at) as first_seen,
            MAX(created_at) as last_active,
            COUNT(*) as total_events,
            (
                SELECT e2.event_category FROM log_events e2
                WHERE e2.user_hash = e.user_hash
                GROUP BY e2.event_category ORDER BY COUNT(*) DESC LIMIT 1
            ) as top_category
        FROM log_events e
        WHERE created_at BETWEEN :from AND :to
        GROUP BY user_hash
        ORDER BY first_seen
    ");
    $stmt->execute(['from' => $from, 'to' => $to]);

    $i = 0;
    while ($row = $stmt->fetch()) {
        fputcsv($output, [
            'Användare ' . chr(65 + $i),
            $row['first_seen'],
            $row['last_active'],
            $row['total_events'],
            $row['top_category'],
        ]);
        $i++;
    }
}

function getUserLabels($db) {
    $stmt = $db->query("
        SELECT user_hash, MIN(created_at) as first_seen
        FROM log_events GROUP BY user_hash ORDER BY first_seen
    ");
    $labels = [];
    $i = 0;
    while ($row = $stmt->fetch()) {
        $labels[$row['user_hash']] = 'Användare ' . chr(65 + $i);
        $i++;
    }
    return $labels;
}

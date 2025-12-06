<?php
// api/debug_db.php
// Visit this file in your browser: https://silvervidh.se/forsta-kapitlet/api/debug_db.php

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Database Connection Debugger</h1>";

// 1. Check if .env exists
if (!file_exists(__DIR__ . '/.env')) {
    die("<h3 style='color:red'>❌ Error: .env file not found in " . __DIR__ . "</h3>");
}
echo "<p>✅ .env file found.</p>";

// 2. Load .env
$env = parse_ini_file(__DIR__ . '/.env');
if (!$env) {
    die("<h3 style='color:red'>❌ Error: Could not parse .env file.</h3>");
}

echo "<h2>Configuration:</h2>";
echo "<ul>";
echo "<li><strong>DB_HOST:</strong> " . ($env['DB_HOST'] ?? 'NOT SET') . "</li>";
echo "<li><strong>DB_NAME:</strong> " . ($env['DB_NAME'] ?? 'NOT SET') . "</li>";
echo "<li><strong>DB_USER:</strong> " . ($env['DB_USER'] ?? 'NOT SET') . "</li>";
echo "<li><strong>DB_PASS:</strong> " . (isset($env['DB_PASS']) ? '****** (Masked)' : 'NOT SET') . "</li>";
echo "</ul>";

// 3. Attempt Connection
echo "<h2>Attempting Connection...</h2>";

try {
    $dsn = "mysql:host=" . ($env['DB_HOST'] ?? '') . ";dbname=" . ($env['DB_NAME'] ?? '') . ";charset=utf8mb4";
    $pdo = new PDO($dsn, $env['DB_USER'] ?? '', $env['DB_PASS'] ?? '');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "<h2 style='color:green'>✅ SUCCESS! Connected to database.</h2>";
    echo "<p>Server info: " . $pdo->getAttribute(PDO::ATTR_SERVER_INFO) . "</p>";
    
} catch (PDOException $e) {
    echo "<h2 style='color:red'>❌ CONNECTION FAILED</h2>";
    echo "<div style='background:#fee; padding:20px; border:1px solid red; border-radius:5px;'>";
    echo "<strong>Error Message:</strong><br>";
    echo $e->getMessage();
    echo "</div>";
}

<?php
/**
 * Admin API - User Management
 * Handles listing, creating, updating, and deleting users
 */

require_once __DIR__ . '/../config.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Require admin authentication for all admin endpoints
requireAdmin();

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // List all users
            listUsers();
            break;

        case 'POST':
            // Create new user
            createUser();
            break;

        case 'PUT':
            // Update user
            updateUser();
            break;

        case 'DELETE':
            // Delete user
            deleteUser();
            break;

        default:
            throw new Exception('Method not allowed');
    }
} catch (Exception $e) {
    sendError($e->getMessage(), 500);
}

/**
 * List all users with pagination
 */
function listUsers() {
    $pdo = getDB();

    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
    $offset = isset($_GET['offset']) ? (int)$_GET['offset'] : 0;
    $search = isset($_GET['search']) ? $_GET['search'] : '';

    try {
        // Build query
        $whereClause = '';
        $params = [];

        if (!empty($search)) {
            $whereClause = 'WHERE email LIKE :search OR name LIKE :search';
            $params[':search'] = '%' . $search . '%';
        }

        // Get total count
        $countStmt = $pdo->prepare("SELECT COUNT(*) FROM users $whereClause");
        $countStmt->execute($params);
        $total = $countStmt->fetchColumn();

        // Get users
        $params[':limit'] = $limit;
        $params[':offset'] = $offset;

        $stmt = $pdo->prepare("
            SELECT
                id,
                email,
                name,
                is_admin,
                verified_at,
                created_at,
                updated_at
            FROM users
            $whereClause
            ORDER BY created_at DESC
            LIMIT :limit OFFSET :offset
        ");

        foreach ($params as $key => $value) {
            if ($key === ':limit' || $key === ':offset') {
                $stmt->bindValue($key, $value, PDO::PARAM_INT);
            } else {
                $stmt->bindValue($key, $value);
            }
        }

        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Format dates and add verified status
        foreach ($users as &$user) {
            $user['verified'] = !is_null($user['verified_at']);
            $user['is_admin'] = (int)$user['is_admin'];
            $user['created_at'] = date('Y-m-d H:i:s', strtotime($user['created_at']));
            $user['updated_at'] = date('Y-m-d H:i:s', strtotime($user['updated_at']));
        }

        sendSuccess([
            'users' => $users,
            'total' => (int)$total,
            'limit' => $limit,
            'offset' => $offset
        ]);

    } catch (PDOException $e) {
        error_log('Database error in listUsers: ' . $e->getMessage());
        sendError('Failed to fetch users');
    }
}

/**
 * Create new user
 */
function createUser() {
    $pdo = getDB();

    $input = getJsonInput();

    // Validate input
    if (empty($input['email']) || empty($input['password'])) {
        sendError('Email and password are required', 400);
    }

    if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
        sendError('Invalid email format', 400);
    }

    if (strlen($input['password']) < 6) {
        sendError('Password must be at least 6 characters', 400);
    }

    $email = trim($input['email']);
    $password = $input['password'];
    $name = isset($input['name']) ? trim($input['name']) : '';
    $verified = isset($input['verified']) ? (bool)$input['verified'] : false;
    $isAdmin = isset($input['is_admin']) ? (int)(bool)$input['is_admin'] : 0;

    try {
        // Check if email already exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE email = :email');
        $stmt->execute([':email' => $email]);

        if ($stmt->fetch()) {
            sendError('Email already registered', 409);
        }

        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        // Insert user
        $stmt = $pdo->prepare('
            INSERT INTO users (email, password, name, verified_at, is_admin)
            VALUES (:email, :password, :name, :verified_at, :is_admin)
        ');

        $stmt->execute([
            ':email' => $email,
            ':password' => $hashedPassword,
            ':name' => $name,
            ':verified_at' => $verified ? date('Y-m-d H:i:s') : null,
            ':is_admin' => $isAdmin
        ]);

        $userId = $pdo->lastInsertId();

        sendSuccess([
            'message' => 'User created successfully',
            'userId' => (int)$userId,
            'user' => [
                'id' => (int)$userId,
                'email' => $email,
                'name' => $name,
                'verified' => $verified,
                'is_admin' => $isAdmin
            ]
        ], 201);

    } catch (PDOException $e) {
        error_log('Database error in createUser: ' . $e->getMessage());
        sendError('Failed to create user');
    }
}

/**
 * Update user
 */
function updateUser() {
    $pdo = getDB();

    $input = getJsonInput();

    if (empty($input['id'])) {
        sendError('User ID is required', 400);
    }

    $userId = (int)$input['id'];

    try {
        // Check if user exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE id = :id');
        $stmt->execute([':id' => $userId]);

        if (!$stmt->fetch()) {
            sendError('User not found', 404);
        }

        // Build update query dynamically
        $updates = [];
        $params = [':id' => $userId];

        if (isset($input['email'])) {
            if (!filter_var($input['email'], FILTER_VALIDATE_EMAIL)) {
                sendError('Invalid email format', 400);
            }
            $updates[] = 'email = :email';
            $params[':email'] = trim($input['email']);
        }

        if (isset($input['name'])) {
            $updates[] = 'name = :name';
            $params[':name'] = trim($input['name']);
        }

        if (isset($input['password']) && !empty($input['password'])) {
            if (strlen($input['password']) < 6) {
                sendError('Password must be at least 6 characters', 400);
            }
            $updates[] = 'password = :password';
            $params[':password'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }

        if (isset($input['verified'])) {
            $updates[] = 'verified_at = :verified_at';
            $params[':verified_at'] = $input['verified'] ? date('Y-m-d H:i:s') : null;
        }

        if (isset($input['is_admin'])) {
            $updates[] = 'is_admin = :is_admin';
            $params[':is_admin'] = (int)(bool)$input['is_admin'];
        }

        if (empty($updates)) {
            sendError('No fields to update', 400);
        }

        // Execute update
        $sql = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendSuccess([
            'message' => 'User updated successfully',
            'userId' => $userId
        ]);

    } catch (PDOException $e) {
        error_log('Database error in updateUser: ' . $e->getMessage());
        sendError('Failed to update user');
    }
}

/**
 * Delete user
 */
function deleteUser() {
    $pdo = getDB();

    $userId = isset($_GET['id']) ? (int)$_GET['id'] : 0;

    if ($userId <= 0) {
        sendError('Invalid user ID', 400);
    }

    try {
        // Check if user exists
        $stmt = $pdo->prepare('SELECT id FROM users WHERE id = :id');
        $stmt->execute([':id' => $userId]);

        if (!$stmt->fetch()) {
            sendError('User not found', 404);
        }

        // Delete user (cascade will handle related records)
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = :id');
        $stmt->execute([':id' => $userId]);

        sendSuccess([
            'message' => 'User deleted successfully',
            'userId' => $userId
        ]);

    } catch (PDOException $e) {
        error_log('Database error in deleteUser: ' . $e->getMessage());
        sendError('Failed to delete user');
    }
}

<?php
header("Content-Type: application/json; charset=UTF-8");
require_once 'db_config.php';

// --- Database Connection ---
try {
    $conn = new mysqli(DB_HOST, DB_USERNAME, DB_PASSWORD, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception("Connection failed: " . $conn->connect_error);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["error" => "Database connection error."]);
    exit();
}


// --- Request Handling ---
$method = $_SERVER['REQUEST_METHOD'];
$path_info = isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '';
$request = explode('/', trim($path_info, '/'));
$input = json_decode(file_get_contents('php://input'), true);
$endpoint = array_shift($request);

// --- API Routing ---
switch ($endpoint) {
    case 'user':
        if ($method == 'POST') {
            handleUser($conn, $input);
        } else {
            sendNotFound();
        }
        break;

    case 'stats':
        if ($method == 'GET') {
            getStats($conn);
        } else {
            sendNotFound();
        }
        break;

    case 'transaction':
        if ($method == 'POST') {
            createTransaction($conn, $input);
        } else {
            sendNotFound();
        }
        break;

    default:
        sendNotFound();
        break;
}

$conn->close();

// --- API Functions ---

function handleUser($conn, $input) {
    if (!isset($input['wallet_address'])) {
        http_response_code(400);
        echo json_encode(['error' => 'wallet_address is required']);
        return;
    }

    $wallet_address = $input['wallet_address'];

    // Check if user exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE wallet_address = ?");
    $stmt->bind_param("s", $wallet_address);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        // User exists
        echo json_encode(['message' => 'User logged in successfully.']);
    } else {
        // User does not exist, create new user
        $stmt_insert = $conn->prepare("INSERT INTO users (wallet_address) VALUES (?)");
        $stmt_insert->bind_param("s", $wallet_address);
        if ($stmt_insert->execute()) {
            echo json_encode(['message' => 'User registered successfully.']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to register user.']);
        }
        $stmt_insert->close();
    }

    $stmt->close();
}

function getStats($conn) {
    $result = $conn->query("SELECT COUNT(*) as total_users FROM users");
    $users = $result->fetch_assoc();

    $result = $conn->query("SELECT SUM(amount) as total_volume FROM transactions");
    $volume = $result->fetch_assoc();

    echo json_encode([
        'total_users' => (int)$users['total_users'],
        'total_volume' => (float)($volume['total_volume'] ?? 0)
    ]);
}

function createTransaction($conn, $input) {
    if (!isset($input['wallet_address'], $input['amount'], $input['transaction_type'])) {
        http_response_code(400);
        echo json_encode(['error' => 'wallet_address, amount, and transaction_type are required']);
        return;
    }

    // Find user_id from wallet_address
    $stmt_user = $conn->prepare("SELECT id FROM users WHERE wallet_address = ?");
    $stmt_user->bind_param("s", $input['wallet_address']);
    $stmt_user->execute();
    $result_user = $stmt_user->get_result();
    if ($result_user->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found.']);
        return;
    }
    $user = $result_user->fetch_assoc();
    $user_id = $user['id'];
    $stmt_user->close();

    // Insert transaction
    $stmt = $conn->prepare("INSERT INTO transactions (user_id, amount, transaction_type) VALUES (?, ?, ?)");
    $stmt->bind_param("ids", $user_id, $input['amount'], $input['transaction_type']);

    if ($stmt->execute()) {
        echo json_encode(['message' => 'Transaction created successfully.']);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create transaction.']);
    }

    $stmt->close();
}

function sendNotFound() {
    http_response_code(404);
    echo json_encode(['error' => 'Not Found']);
}

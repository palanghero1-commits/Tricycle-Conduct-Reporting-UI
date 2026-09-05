<?php
declare(strict_types=1);

$configPath = __DIR__ . '/config.php';
$config = file_exists($configPath) ? require $configPath : require __DIR__ . '/config.example.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($config['frontend_origin'] ?? '*'));
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$pdo = new PDO(
    "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4",
    $config['db_user'],
    $config['db_pass'],
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
);

const ROLES = ['STUDENT', 'DRIVER', 'TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP'];
const STATUSES = ['SUBMITTED', 'RECEIVED', 'UNDER_REVIEW', 'VERIFIED', 'REFERRED', 'RESOLVED', 'CLOSED'];
const ALLOWED_TRANSITIONS = [
    'SUBMITTED' => ['RECEIVED', 'UNDER_REVIEW', 'CLOSED'],
    'RECEIVED' => ['UNDER_REVIEW', 'REFERRED', 'CLOSED'],
    'UNDER_REVIEW' => ['VERIFIED', 'REFERRED', 'RESOLVED', 'CLOSED'],
    'VERIFIED' => ['REFERRED', 'RESOLVED', 'CLOSED'],
    'REFERRED' => ['RESOLVED', 'CLOSED'],
    'RESOLVED' => ['CLOSED'],
    'CLOSED' => [],
];

function json_response(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function fail(int $status, string $message): void {
    json_response(['error' => ['message' => $message]], $status);
}

function input_json(): array {
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function uuidv4(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function base64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function token_create(array $user, string $secret): string {
    $header = base64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload = base64url_encode(json_encode(['sub' => $user['id'], 'role' => $user['role'], 'exp' => time() + 28800]));
    $signature = base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
    return "$header.$payload.$signature";
}

function token_verify(string $token, string $secret): ?array {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $payload, $signature] = $parts;
    $expected = base64url_encode(hash_hmac('sha256', "$header.$payload", $secret, true));
    if (!hash_equals($expected, $signature)) return null;
    $data = json_decode(base64url_decode($payload), true);
    if (!is_array($data) || ($data['exp'] ?? 0) < time()) return null;
    return $data;
}

function auth(PDO $pdo, array $config): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/Bearer\s+(.+)/', $header, $matches)) fail(401, 'Authentication required.');
    $payload = token_verify($matches[1], $config['jwt_secret']);
    if (!$payload) fail(401, 'Invalid or expired session.');
    $stmt = $pdo->prepare('SELECT id, full_name, email, role, status FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();
    if (!$user || $user['status'] !== 'ACTIVE') fail(401, 'Account is not active.');
    return $user;
}

function require_roles(array $user, array $roles): void {
    if (!in_array($user['role'], $roles, true)) fail(403, 'You are not authorized to access this resource.');
}

function audit(PDO $pdo, ?string $userId, string $action, ?string $targetType = null, ?string $targetId = null, ?array $metadata = null): void {
    $stmt = $pdo->prepare('INSERT INTO audit_logs (user_id, action, target_type, target_id, metadata) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$userId, $action, $targetType, $targetId, $metadata ? json_encode($metadata) : null]);
}

function notify(PDO $pdo, string $recipientId, string $type, string $message, ?string $complaintId = null): void {
    $stmt = $pdo->prepare('INSERT INTO notifications (id, recipient_user_id, type, message, related_complaint_id) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([uuidv4(), $recipientId, $type, $message, $complaintId]);
}

function notify_officers(PDO $pdo, string $type, string $message, string $complaintId): void {
    $stmt = $pdo->query("SELECT id FROM users WHERE status = 'ACTIVE' AND role IN ('TODA_PRESIDENT','AUTHORIZED_PERSONNEL','SUPERADMIN','PNP')");
    foreach ($stmt->fetchAll() as $officer) {
        notify($pdo, $officer['id'], $type, $message, $complaintId);
    }
}

function public_user(array $user): array {
    return ['id' => $user['id'], 'fullName' => $user['full_name'], 'email' => $user['email'], 'role' => $user['role'], 'status' => $user['status']];
}

function create_user(PDO $pdo, array $input, string $role, ?string $createdBy = null): array {
    foreach (['fullName', 'password'] as $field) {
        if (empty($input[$field])) fail(400, "$field is required.");
    }
    if (empty($input['email']) && empty($input['username'])) fail(400, 'Email or username is required.');
    if (!empty($input['email']) && !filter_var($input['email'], FILTER_VALIDATE_EMAIL)) fail(400, 'Use a valid email address.');
    if (strlen($input['password']) < 8) fail(400, 'Password must be at least 8 characters.');
    $userId = uuidv4();
    $stmt = $pdo->prepare('INSERT INTO users (id, full_name, email, username, password_hash, role, contact_number, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $userId,
        trim($input['fullName']),
        !empty($input['email']) ? strtolower($input['email']) : null,
        !empty($input['username']) ? strtolower($input['username']) : null,
        password_hash($input['password'], PASSWORD_DEFAULT),
        $role,
        $input['contactNumber'] ?? null,
        $createdBy,
    ]);
    return ['id' => $userId, 'full_name' => trim($input['fullName']), 'email' => !empty($input['email']) ? strtolower($input['email']) : null, 'role' => $role, 'status' => 'ACTIVE'];
}

function route_path(): string {
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?: '/';
    $script = $_SERVER['SCRIPT_NAME'] ?? '';
    if ($script && str_starts_with($uri, $script)) return '/' . trim(substr($uri, strlen($script)), '/');
    $base = rtrim(dirname($script), '/\\');
    if ($base && str_starts_with($uri, $base)) return '/' . trim(substr($uri, strlen($base)), '/');
    return '/' . trim($uri, '/');
}

$method = $_SERVER['REQUEST_METHOD'];
$path = route_path();

try {
    if ($method === 'GET' && $path === '/healthz') {
        json_response(['status' => 'ok']);
    }

    if ($method === 'POST' && $path === '/auth/register') {
        $data = input_json();
        foreach (['fullName', 'email', 'password', 'confirmPassword'] as $field) {
            if (empty($data[$field])) fail(400, "$field is required.");
        }
        $role = strtoupper((string) ($data['role'] ?? 'STUDENT'));
        if (!in_array($role, ['STUDENT', 'DRIVER'], true)) fail(400, 'Only student and driver accounts can self-register.');
        if ($role === 'STUDENT' && empty($data['studentId'])) fail(400, 'studentId is required.');
        if ($role === 'DRIVER') {
            foreach (['driverCode', 'tricycleIdentifier'] as $field) {
                if (empty($data[$field])) fail(400, "$field is required.");
            }
        }
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) fail(400, 'Use a valid email address.');
        if (strlen($data['password']) < 8) fail(400, 'Password must be at least 8 characters.');
        if ($data['password'] !== $data['confirmPassword']) fail(400, 'Passwords do not match.');
        $pdo->beginTransaction();
        $userId = uuidv4();
        $stmt = $pdo->prepare('INSERT INTO users (id, full_name, email, password_hash, role, contact_number) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, trim($data['fullName']), strtolower($data['email']), password_hash($data['password'], PASSWORD_DEFAULT), $role, $data['contactNumber'] ?? null]);
        if ($role === 'STUDENT') {
            $stmt = $pdo->prepare('INSERT INTO students (user_id, student_id, program, year_level) VALUES (?, ?, ?, ?)');
            $stmt->execute([$userId, trim($data['studentId']), $data['program'] ?? null, $data['yearLevel'] ?? null]);
        } else {
            $stmt = $pdo->prepare('INSERT INTO drivers (user_id, toda_id, full_name, driver_code, tricycle_identifier, route_area, contact_number) VALUES (?, 1, ?, ?, ?, ?, ?)');
            $stmt->execute([$userId, trim($data['fullName']), trim($data['driverCode']), trim($data['tricycleIdentifier']), $data['routeArea'] ?? null, $data['contactNumber'] ?? null]);
        }
        audit($pdo, $userId, 'REGISTER', 'users', $userId);
        $pdo->commit();
        $user = ['id' => $userId, 'full_name' => trim($data['fullName']), 'email' => strtolower($data['email']), 'role' => $role, 'status' => 'ACTIVE'];
        json_response(['user' => public_user($user), 'token' => token_create($user, $config['jwt_secret'])], 201);
    }

    if ($method === 'POST' && $path === '/auth/login') {
        $data = input_json();
        $account = strtolower($data['email'] ?? $data['username'] ?? '');
        $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1');
        $stmt->execute([$account, $account]);
        $user = $stmt->fetch();
        if (!$user || $user['status'] !== 'ACTIVE' || !password_verify($data['password'] ?? '', $user['password_hash'])) fail(401, 'Invalid email or password.');
        audit($pdo, $user['id'], 'LOGIN', 'users', $user['id']);
        json_response(['user' => public_user($user), 'token' => token_create($user, $config['jwt_secret'])]);
    }

    if ($method === 'POST' && $path === '/users/authorized-personnel') {
        $creator = auth($pdo, $config);
        require_roles($creator, ['SUPERADMIN']);
        $data = input_json();
        $pdo->beginTransaction();
        $user = create_user($pdo, $data, ($data['role'] ?? '') === 'PNP' ? 'PNP' : 'AUTHORIZED_PERSONNEL', $creator['id']);
        $stmt = $pdo->prepare('INSERT INTO authorized_personnel (user_id, personnel_type, office_name, position_title) VALUES (?, ?, ?, ?)');
        $stmt->execute([$user['id'], $data['personnelType'] ?? 'BARANGAY_STAFF', $data['officeName'] ?? 'Barangay Old Sagay', $data['positionTitle'] ?? null]);
        audit($pdo, $creator['id'], 'AUTHORIZED_PERSONNEL_CREATE', 'users', $user['id']);
        $pdo->commit();
        json_response(['user' => public_user($user)], 201);
    }

    if ($method === 'POST' && $path === '/users/toda-presidents') {
        $creator = auth($pdo, $config);
        require_roles($creator, ['AUTHORIZED_PERSONNEL', 'SUPERADMIN']);
        $data = input_json();
        if (empty($data['todaId'])) fail(400, 'todaId is required.');
        $pdo->beginTransaction();
        $user = create_user($pdo, $data, 'TODA_PRESIDENT', $creator['id']);
        $stmt = $pdo->prepare('UPDATE todas SET president_user_id = ? WHERE id = ?');
        $stmt->execute([$user['id'], (int) $data['todaId']]);
        audit($pdo, $creator['id'], 'TODA_PRESIDENT_CREATE', 'users', $user['id'], ['todaId' => (int) $data['todaId']]);
        $pdo->commit();
        json_response(['user' => public_user($user)], 201);
    }

    if ($method === 'POST' && $path === '/drivers/accounts') {
        $creator = auth($pdo, $config);
        require_roles($creator, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN']);
        $data = input_json();
        foreach (['fullName', 'driverCode', 'tricycleIdentifier', 'password'] as $field) {
            if (empty($data[$field])) fail(400, "$field is required.");
        }
        if ($creator['role'] === 'TODA_PRESIDENT' && !empty($data['contactNumber'])) {
            fail(400, 'TODA president-created driver accounts are only for drivers without a phone number.');
        }
        $pdo->beginTransaction();
        $user = create_user($pdo, $data, 'DRIVER', $creator['id']);
        $stmt = $pdo->prepare('INSERT INTO drivers (user_id, toda_id, full_name, driver_code, tricycle_identifier, plate_number, route_area, contact_number, account_created_by, account_creation_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $user['id'],
            (int) ($data['todaId'] ?? 1),
            trim($data['fullName']),
            trim($data['driverCode']),
            trim($data['tricycleIdentifier']),
            $data['plateNumber'] ?? null,
            $data['routeArea'] ?? null,
            $data['contactNumber'] ?? null,
            $creator['id'],
            empty($data['contactNumber']) ? 'TODA_CREATED_NO_PHONE' : 'AUTHORIZED_CREATED',
        ]);
        audit($pdo, $creator['id'], 'DRIVER_ACCOUNT_CREATE', 'users', $user['id']);
        $pdo->commit();
        json_response(['user' => public_user($user)], 201);
    }

    if ($method === 'POST' && $path === '/auth/logout') {
        $user = auth($pdo, $config);
        audit($pdo, $user['id'], 'LOGOUT', 'users', $user['id']);
        json_response(['ok' => true]);
    }

    if ($method === 'GET' && $path === '/me') {
        json_response(['user' => public_user(auth($pdo, $config))]);
    }

    if ($method === 'GET' && $path === '/drivers') {
        auth($pdo, $config);
        $search = '%' . ($_GET['search'] ?? '') . '%';
        $stmt = $pdo->prepare('SELECT id, full_name AS fullName, driver_code AS driverCode, tricycle_identifier AS tricycleIdentifier, plate_number AS plateNumber, route_area AS routeArea, contact_number AS contactNumber, is_active AS isActive FROM drivers WHERE is_active = 1 AND (full_name LIKE ? OR driver_code LIKE ? OR tricycle_identifier LIKE ?) ORDER BY full_name LIMIT 100');
        $stmt->execute([$search, $search, $search]);
        json_response(['drivers' => $stmt->fetchAll()]);
    }

    if ($method === 'GET' && $path === '/categories') {
        auth($pdo, $config);
        $stmt = $pdo->query('SELECT id, name, description FROM complaint_categories WHERE is_active = 1 ORDER BY name');
        json_response(['categories' => $stmt->fetchAll()]);
    }

    if ($method === 'POST' && $path === '/complaints') {
        $user = auth($pdo, $config);
        require_roles($user, ['STUDENT']);
        foreach (['driverId', 'categoryId', 'incidentDate', 'incidentTime', 'location', 'description'] as $field) {
            if (empty($_POST[$field])) fail(400, "$field is required.");
        }
        if (strlen($_POST['description']) < 15) fail(400, 'Description must be at least 15 characters.');
        $driverId = (int) $_POST['driverId'];
        $categoryId = (int) $_POST['categoryId'];
        $pdo->beginTransaction();
        $driver = $pdo->prepare('SELECT id FROM drivers WHERE id = ? AND is_active = 1');
        $driver->execute([$driverId]);
        $category = $pdo->prepare('SELECT id FROM complaint_categories WHERE id = ? AND is_active = 1');
        $category->execute([$categoryId]);
        if (!$driver->fetch() || !$category->fetch()) fail(400, 'Invalid driver or category.');
        $complaintId = uuidv4();
        $reference = 'TRC-' . date('Y') . '-' . random_int(100000, 999999);
        $stmt = $pdo->prepare("INSERT INTO complaints (id, reference_number, student_user_id, driver_id, category_id, status, incident_date, incident_time, location, description) VALUES (?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?, ?)");
        $stmt->execute([$complaintId, $reference, $user['id'], $driverId, $categoryId, $_POST['incidentDate'], $_POST['incidentTime'], trim($_POST['location']), trim($_POST['description'])]);
        $stmt = $pdo->prepare("INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, NULL, 'SUBMITTED', ?, ?)");
        $stmt->execute([$complaintId, $user['id'], 'Complaint submitted by student.']);
        save_uploads($pdo, $config, $complaintId, $user['id']);
        audit($pdo, $user['id'], 'COMPLAINT_CREATE', 'complaints', $complaintId);
        $pdo->commit();
        notify($pdo, $user['id'], 'COMPLAINT_SUBMITTED', "Complaint $reference was submitted.", $complaintId);
        notify_officers($pdo, 'NEW_COMPLAINT', "New complaint $reference requires review.", $complaintId);
        json_response(['complaint' => ['id' => $complaintId, 'referenceNumber' => $reference, 'status' => 'SUBMITTED']], 201);
    }

    if ($method === 'GET' && $path === '/complaints') {
        $user = auth($pdo, $config);
        $where = [];
        $params = [];
        if ($user['role'] === 'STUDENT') {
            $where[] = 'student_user_id = ?';
            $params[] = $user['id'];
        }
        foreach (['status' => 'status', 'driverId' => 'driver_id', 'categoryId' => 'category_id'] as $query => $column) {
            if (!empty($_GET[$query])) {
                $where[] = "$column = ?";
                $params[] = $_GET[$query];
            }
        }
        if (!empty($_GET['reference'])) {
            $where[] = 'reference_number LIKE ?';
            $params[] = '%' . $_GET['reference'] . '%';
        }
        $sql = 'SELECT id, reference_number AS referenceNumber, status, driver_id AS driverId, category_id AS categoryId, incident_date AS incidentDate, incident_time AS incidentTime, location, description, created_at AS createdAt FROM complaints';
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY created_at DESC LIMIT 100';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        json_response(['complaints' => $stmt->fetchAll()]);
    }

    if ($method === 'GET' && preg_match('#^/complaints/([a-f0-9-]+)$#', $path, $m)) {
        $user = auth($pdo, $config);
        $complaint = complaint_or_404($pdo, $m[1], $user);
        $details = complaint_details($pdo, $complaint);
        json_response($details);
    }

    if ($method === 'GET' && preg_match('#^/attachments/([a-f0-9-]+)$#', $path, $m)) {
        $user = auth($pdo, $config);
        $attachment = row($pdo, 'SELECT * FROM complaint_attachments WHERE id = ? LIMIT 1', [$m[1]]);
        if (!$attachment) fail(404, 'Attachment not found.');
        $complaint = complaint_or_404($pdo, $attachment['complaint_id'], $user);
        if (!is_file($attachment['storage_path'])) fail(404, 'Attachment file not found.');
        header('Content-Type: ' . $attachment['mime_type']);
        header('Content-Disposition: attachment; filename="' . basename($attachment['original_name']) . '"');
        header('Content-Length: ' . filesize($attachment['storage_path']));
        readfile($attachment['storage_path']);
        exit;
    }

    if ($method === 'PATCH' && preg_match('#^/complaints/([a-f0-9-]+)/status$#', $path, $m)) {
        $user = auth($pdo, $config);
        require_roles($user, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $data = input_json();
        $next = $data['status'] ?? '';
        if (!in_array($next, STATUSES, true)) fail(400, 'Invalid status.');
        $complaint = complaint_or_404($pdo, $m[1], $user, false);
        if (!in_array($next, ALLOWED_TRANSITIONS[$complaint['status']], true)) fail(400, 'That status transition is not allowed.');
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('UPDATE complaints SET status = ? WHERE id = ?');
        $stmt->execute([$next, $complaint['id']]);
        $stmt = $pdo->prepare('INSERT INTO complaint_status_history (complaint_id, previous_status, new_status, changed_by, remarks) VALUES (?, ?, ?, ?, ?)');
        $stmt->execute([$complaint['id'], $complaint['status'], $next, $user['id'], $data['remarks'] ?? null]);
        audit($pdo, $user['id'], 'COMPLAINT_STATUS_UPDATE', 'complaints', $complaint['id'], ['from' => $complaint['status'], 'to' => $next]);
        $pdo->commit();
        notify($pdo, $complaint['student_user_id'], 'COMPLAINT_STATUS_UPDATED', 'Complaint ' . $complaint['reference_number'] . ' is now ' . str_replace('_', ' ', $next) . '.', $complaint['id']);
        json_response(['complaint' => ['id' => $complaint['id'], 'referenceNumber' => $complaint['reference_number'], 'status' => $next]]);
    }

    if ($method === 'POST' && preg_match('#^/complaints/([a-f0-9-]+)/actions$#', $path, $m)) {
        $user = auth($pdo, $config);
        require_roles($user, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $data = input_json();
        if (empty($data['actionType']) || empty($data['description'])) fail(400, 'Action type and description are required.');
        $complaint = complaint_or_404($pdo, $m[1], $user, false);
        $stmt = $pdo->prepare('INSERT INTO complaint_actions (complaint_id, action_type, description, action_taken_by) VALUES (?, ?, ?, ?)');
        $stmt->execute([$complaint['id'], $data['actionType'], $data['description'], $user['id']]);
        audit($pdo, $user['id'], 'COMPLAINT_ACTION_CREATE', 'complaint_actions', (string) $pdo->lastInsertId(), ['complaintId' => $complaint['id']]);
        notify($pdo, $complaint['student_user_id'], 'COMPLAINT_ACTION_RECORDED', 'An action was recorded for complaint ' . $complaint['reference_number'] . '.', $complaint['id']);
        json_response(['action' => ['id' => (int) $pdo->lastInsertId()]], 201);
    }

    if ($method === 'POST' && preg_match('#^/complaints/([a-f0-9-]+)/violations$#', $path, $m)) {
        $user = auth($pdo, $config);
        require_roles($user, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $data = input_json();
        $complaint = complaint_or_404($pdo, $m[1], $user, false);
        if (!in_array($complaint['status'], ['VERIFIED', 'RESOLVED', 'CLOSED'], true)) fail(400, 'A confirmed violation can only be recorded after appropriate review.');
        $stmt = $pdo->prepare('INSERT INTO violations (driver_id, complaint_id, violation_category, description, confirmed_by, remarks) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$complaint['driver_id'], $complaint['id'], $data['violationCategory'] ?? '', $data['description'] ?? '', $user['id'], $data['remarks'] ?? null]);
        audit($pdo, $user['id'], 'VIOLATION_CREATE', 'violations', (string) $pdo->lastInsertId(), ['complaintId' => $complaint['id']]);
        json_response(['violation' => ['id' => (int) $pdo->lastInsertId()]], 201);
    }

    if ($method === 'GET' && $path === '/notifications') {
        $user = auth($pdo, $config);
        $stmt = $pdo->prepare('SELECT id, type, message, related_complaint_id AS relatedComplaintId, read_at AS readAt, created_at AS createdAt FROM notifications WHERE recipient_user_id = ? ORDER BY created_at DESC LIMIT 100');
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();
        json_response(['notifications' => $rows, 'unread' => count(array_filter($rows, fn($row) => $row['readAt'] === null))]);
    }

    if ($method === 'PATCH' && preg_match('#^/notifications/([a-f0-9-]+)/read$#', $path, $m)) {
        $user = auth($pdo, $config);
        $stmt = $pdo->prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE id = ? AND recipient_user_id = ?');
        $stmt->execute([$m[1], $user['id']]);
        json_response(['ok' => true]);
    }

    if ($method === 'PATCH' && $path === '/notifications/read-all') {
        $user = auth($pdo, $config);
        $stmt = $pdo->prepare('UPDATE notifications SET read_at = CURRENT_TIMESTAMP WHERE recipient_user_id = ?');
        $stmt->execute([$user['id']]);
        json_response(['ok' => true]);
    }

    if ($method === 'GET' && $path === '/dashboard/stats') {
        $user = auth($pdo, $config);
        require_roles($user, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $byStatus = $pdo->query('SELECT status, COUNT(*) AS total FROM complaints GROUP BY status')->fetchAll();
        $violations = $pdo->query('SELECT COUNT(*) AS total FROM violations')->fetch();
        json_response(['byStatus' => $byStatus, 'confirmedViolations' => (int) $violations['total']]);
    }

    if ($method === 'GET' && $path === '/reports/summary') {
        $user = auth($pdo, $config);
        require_roles($user, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $byStatus = $pdo->query('SELECT status AS label, COUNT(*) AS total FROM complaints GROUP BY status')->fetchAll();
        $byCategory = $pdo->query('SELECT c.name AS label, COUNT(*) AS total FROM complaints r JOIN complaint_categories c ON c.id = r.category_id GROUP BY c.name')->fetchAll();
        $monthly = $pdo->query("SELECT DATE_FORMAT(created_at, '%Y-%m') AS label, COUNT(*) AS total FROM complaints GROUP BY DATE_FORMAT(created_at, '%Y-%m')")->fetchAll();
        json_response(['byStatus' => $byStatus, 'byCategory' => $byCategory, 'monthly' => $monthly]);
    }

    if ($method === 'POST' && $path === '/seed') {
        seed($pdo);
        json_response(['ok' => true, 'seededPassword' => 'Password123!']);
    }

    fail(404, 'Route not found.');
} catch (PDOException $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail(500, 'Database request failed.');
} catch (Throwable $e) {
    if ($pdo->inTransaction()) $pdo->rollBack();
    fail(500, 'The request could not be completed.');
}

function complaint_or_404(PDO $pdo, string $id, array $user, bool $checkStudent = true): array {
    $stmt = $pdo->prepare('SELECT * FROM complaints WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $complaint = $stmt->fetch();
    if (!$complaint) fail(404, 'Complaint not found.');
    if ($checkStudent && $user['role'] === 'STUDENT' && $complaint['student_user_id'] !== $user['id']) {
        fail(403, 'You are not authorized to view this complaint.');
    }
    return $complaint;
}

function complaint_details(PDO $pdo, array $complaint): array {
    $driver = row($pdo, 'SELECT * FROM drivers WHERE id = ?', [$complaint['driver_id']]);
    $category = row($pdo, 'SELECT * FROM complaint_categories WHERE id = ?', [$complaint['category_id']]);
    $history = rows($pdo, 'SELECT * FROM complaint_status_history WHERE complaint_id = ? ORDER BY created_at', [$complaint['id']]);
    $actions = rows($pdo, 'SELECT * FROM complaint_actions WHERE complaint_id = ? ORDER BY created_at DESC', [$complaint['id']]);
    $attachments = rows($pdo, 'SELECT id, original_name AS originalName, mime_type AS mimeType, size_bytes AS sizeBytes, created_at AS createdAt FROM complaint_attachments WHERE complaint_id = ?', [$complaint['id']]);
    $violation = row($pdo, 'SELECT * FROM violations WHERE complaint_id = ? LIMIT 1', [$complaint['id']]);
    return ['complaint' => $complaint, 'driver' => $driver, 'category' => $category, 'history' => $history, 'actions' => $actions, 'attachments' => $attachments, 'violation' => $violation ?: null];
}

function row(PDO $pdo, string $sql, array $params): ?array {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $row = $stmt->fetch();
    return $row ?: null;
}

function rows(PDO $pdo, string $sql, array $params): array {
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    return $stmt->fetchAll();
}

function save_uploads(PDO $pdo, array $config, string $complaintId, string $userId): void {
    if (empty($_FILES['attachments'])) return;
    $allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    $dir = $config['upload_dir'];
    if (!is_dir($dir)) mkdir($dir, 0775, true);
    $files = $_FILES['attachments'];
    $names = is_array($files['name']) ? $files['name'] : [$files['name']];
    for ($i = 0; $i < count($names); $i++) {
        $error = is_array($files['error']) ? $files['error'][$i] : $files['error'];
        if ($error !== UPLOAD_ERR_OK) continue;
        $tmp = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $size = is_array($files['size']) ? (int) $files['size'][$i] : (int) $files['size'];
        $original = basename(is_array($files['name']) ? $files['name'][$i] : $files['name']);
        $mime = mime_content_type($tmp) ?: 'application/octet-stream';
        if ($size > 5 * 1024 * 1024 || !in_array($mime, $allowed, true)) fail(400, 'Invalid attachment type or size.');
        $stored = uuidv4() . '.' . strtolower(pathinfo($original, PATHINFO_EXTENSION));
        $target = rtrim($dir, '/\\') . DIRECTORY_SEPARATOR . $stored;
        if (!move_uploaded_file($tmp, $target)) fail(400, 'Attachment upload failed.');
        $stmt = $pdo->prepare('INSERT INTO complaint_attachments (id, complaint_id, original_name, stored_name, mime_type, size_bytes, storage_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([uuidv4(), $complaintId, $original, $stored, $mime, $size, $target, $userId]);
    }
}

function seed(PDO $pdo): void {
    seed_user($pdo, '00000000-0000-4000-8000-000000000000', 'Super Administrator', 'superadmin@oldsagay.gov.ph', 'superadmin', 'SUPERADMIN', null);
    seed_user($pdo, '11111111-1111-4111-8111-111111111111', 'Demo Student', 'student@sunn.edu.ph', null, 'STUDENT', null);
    seed_user($pdo, '22222222-2222-4222-8222-222222222222', 'Rogelio D. Santos', 'driver@oldsagay-toda.ph', null, 'DRIVER', null);
    seed_user($pdo, '33333333-3333-4333-8333-333333333333', 'Authorized Personnel', 'authorized@oldsagay.gov.ph', 'authorized-personnel', 'AUTHORIZED_PERSONNEL', '00000000-0000-4000-8000-000000000000');
    seed_user($pdo, '44444444-4444-4444-8444-444444444444', 'TODA President', 'president@oldsagay-toda.ph', 'toda-president', 'TODA_PRESIDENT', '33333333-3333-4333-8333-333333333333');
    seed_user($pdo, '55555555-5555-4555-8555-555555555555', 'PNP Reviewer', 'pnp@oldsagay.gov.ph', 'pnp-reviewer', 'PNP', '00000000-0000-4000-8000-000000000000');

    $pdo->exec("INSERT IGNORE INTO todas (id, name, barangay, city, province, president_user_id) VALUES (1, 'Old Sagay TODA', 'Old Sagay', 'Sagay City', 'Negros Occidental', '44444444-4444-4444-8444-444444444444')");
    foreach (['Overcharging', 'Reckless Driving', 'Refusal to Transport', 'Discourteous Behavior', 'Unsafe Driving', 'Vehicle Condition', 'Other'] as $name) {
        $stmt = $pdo->prepare('INSERT IGNORE INTO complaint_categories (name) VALUES (?)');
        $stmt->execute([$name]);
    }
    $stmt = $pdo->prepare("INSERT IGNORE INTO authorized_personnel (user_id, personnel_type, office_name, position_title) VALUES (?, ?, ?, ?)");
    $stmt->execute(['33333333-3333-4333-8333-333333333333', 'BARANGAY_STAFF', 'Barangay Old Sagay', 'Authorized Personnel']);
    $stmt->execute(['55555555-5555-4555-8555-555555555555', 'PNP_REVIEWER', 'Sagay City PNP', 'PNP Reviewer']);

    $stmt = $pdo->prepare("INSERT IGNORE INTO students (user_id, student_id, program, year_level, campus) VALUES (?, 'SUNN-2026-0001', 'Capstone Testing Program', '4th year', 'SUNN')");
    $stmt->execute(['11111111-1111-4111-8111-111111111111']);

    $drivers = [
        ['22222222-2222-4222-8222-222222222222', 'Rogelio D. Santos', 'DRV-OS-4821', 'OS-4821', 'Old Sagay Market loop', '44444444-4444-4444-8444-444444444444', 'TODA_CREATED_NO_PHONE'],
        [null, 'Maribel A. Cruz', 'DRV-OS-3176', 'OS-3176', 'Old Sagay Campus loop', null, 'AUTHORIZED_CREATED'],
        [null, 'Jonas P. Villanueva', 'DRV-OS-9084', 'OS-9084', 'Old Sagay Riverside loop', null, 'AUTHORIZED_CREATED'],
    ];
    foreach ($drivers as $driver) {
        $stmt = $pdo->prepare('INSERT IGNORE INTO drivers (user_id, toda_id, full_name, driver_code, tricycle_identifier, route_area, account_created_by, account_creation_reason) VALUES (?, 1, ?, ?, ?, ?, ?, ?)');
        $stmt->execute($driver);
    }
}

function seed_user(PDO $pdo, string $id, string $name, ?string $email, ?string $username, string $role, ?string $createdBy): void {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->fetch()) return;
    $stmt = $pdo->prepare('INSERT INTO users (id, full_name, email, username, password_hash, role, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$id, $name, $email, $username, password_hash('Password123!', PASSWORD_DEFAULT), $role, $createdBy]);
}

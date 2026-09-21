<?php
declare(strict_types=1);

date_default_timezone_set('Asia/Manila');

$configPath = __DIR__ . '/config.php';
$config = file_exists($configPath) ? require $configPath : require __DIR__ . '/config.example.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($config['frontend_origin'] ?? '*'));
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

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

function ensure_profile_photo_column(PDO $pdo): void {
    if (is_postgres($pdo)) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'profile_photo_path'");
    } else {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'profile_photo_path'");
    }
    $stmt->execute();
    if ((int) $stmt->fetchColumn() === 0) {
        $pdo->exec('ALTER TABLE users ADD COLUMN profile_photo_path VARCHAR(500) NULL');
    }
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

function is_postgres(PDO $pdo): bool {
    return $pdo->getAttribute(PDO::ATTR_DRIVER_NAME) === 'pgsql';
}

function last_insert_id(PDO $pdo, string $sequence = ''): string {
    if (!is_postgres($pdo)) return $pdo->lastInsertId();
    return (string) $pdo->query('SELECT LASTVAL()')->fetchColumn();
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
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
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
$pdo = null;

try {
    $driver = strtolower((string) ($config['db_driver'] ?? 'mysql'));
    if ($driver === 'pgsql') {
        $dsn = $config['db_dsn'] ?? sprintf(
            'pgsql:host=%s;port=%s;dbname=%s;sslmode=%s',
            $config['db_host'],
            $config['db_port'] ?? 5432,
            $config['db_name'],
            $config['db_sslmode'] ?? 'require'
        );
    } else {
        $dsn = "mysql:host={$config['db_host']};dbname={$config['db_name']};charset=utf8mb4";
    }
    $pdo = new PDO(
        $dsn,
        $config['db_user'],
        $config['db_pass'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    if (is_postgres($pdo)) {
        $pdo->exec("SET TIME ZONE 'Asia/Manila'");
    } else {
        $pdo->exec("SET time_zone = '+08:00'");
    }
    ensure_profile_photo_column($pdo);

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
            // Do not assume that a TODA has id 1. Locations may be created later
            // or may have different auto-increment IDs in an existing database.
            // Keep this compatible with databases created before is_active was added.
            $defaultToda = row($pdo, 'SELECT id FROM todas WHERE is_active = 1 ORDER BY id LIMIT 1', []);
            if (!$defaultToda) fail(400, 'No active designated location is available. Ask Authorized Personnel to create a location first.');
            $stmt = $pdo->prepare('INSERT INTO drivers (user_id, toda_id, full_name, driver_code, tricycle_identifier, route_area, contact_number) VALUES (?, ?, ?, ?, ?, ?, ?)');
            $stmt->execute([$userId, (int) $defaultToda['id'], trim($data['fullName']), trim($data['driverCode']), trim($data['tricycleIdentifier']), $data['routeArea'] ?? null, $data['contactNumber'] ?? null]);
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
        require_roles($creator, ['AUTHORIZED_PERSONNEL']);
        $data = input_json();
        if (empty($data['todaId'])) fail(400, 'todaId is required.');
        $existing = row($pdo, 'SELECT president_user_id FROM todas WHERE id = ? LIMIT 1', [(int) $data['todaId']]);
        if (!$existing) fail(404, 'TODA not found.');
        if (!empty($existing['president_user_id'])) fail(409, 'This TODA already has a president account. Edit or delete the existing account first.');
        $pdo->beginTransaction();
        $user = create_user($pdo, $data, 'TODA_PRESIDENT', $creator['id']);
        $stmt = $pdo->prepare('UPDATE todas SET president_user_id = ? WHERE id = ?');
        $stmt->execute([$user['id'], (int) $data['todaId']]);
        audit($pdo, $creator['id'], 'TODA_PRESIDENT_CREATE', 'users', $user['id'], ['todaId' => (int) $data['todaId']]);
        $pdo->commit();
        json_response(['user' => public_user($user)], 201);
    }

    if ($method === 'POST' && $path === '/todas') {
        $creator = auth($pdo, $config);
        require_roles($creator, ['AUTHORIZED_PERSONNEL']);
        $data = input_json();
        foreach (['barangay', 'city', 'province'] as $field) {
            if (trim((string) ($data[$field] ?? '')) === '') fail(400, "$field is required.");
        }
        $locationName = trim((string) ($data['name'] ?? '')) ?: trim($data['barangay']) . ', ' . trim($data['city']);
        $stmt = $pdo->prepare('INSERT INTO todas (name, barangay, city, province) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $locationName,
            trim($data['barangay']),
            trim($data['city']),
            trim($data['province']),
        ]);
        $todaId = (int) last_insert_id($pdo, 'todas_id_seq');
        audit($pdo, $creator['id'], 'TODA_CREATE', 'todas', (string) $todaId);
        $toda = row($pdo, 'SELECT id, name, barangay, city, province, president_user_id AS "presidentUserId" FROM todas WHERE id = ?', [$todaId]);
        json_response(['toda' => $toda], 201);
    }

    if ($method === 'GET' && $path === '/todas') {
        $user = auth($pdo, $config);
        require_roles($user, ['AUTHORIZED_PERSONNEL', 'TODA_PRESIDENT', 'SUPERADMIN']);
        if ($user['role'] === 'TODA_PRESIDENT') {
            $stmt = $pdo->prepare('SELECT id, name, barangay, city, province, president_user_id AS "presidentUserId" FROM todas WHERE president_user_id = ? ORDER BY name');
            $stmt->execute([$user['id']]);
            $todas = $stmt->fetchAll();
        } else {
            $todas = $pdo->query('SELECT id, name, barangay, city, province, president_user_id AS "presidentUserId" FROM todas ORDER BY name')->fetchAll();
        }
        json_response(['todas' => $todas]);
    }

    if ($method === 'GET' && $path === '/users/toda-presidents') {
        $user = auth($pdo, $config);
        require_roles($user, ['AUTHORIZED_PERSONNEL', 'SUPERADMIN']);
        $presidents = $pdo->query("SELECT u.id, u.full_name AS \"fullName\", u.email, u.status, t.id AS \"todaId\", t.name AS \"todaName\" FROM users u JOIN todas t ON t.president_user_id = u.id WHERE u.role = 'TODA_PRESIDENT' ORDER BY t.name")->fetchAll();
        json_response(['presidents' => $presidents]);
    }

    if ($method === 'PATCH' && preg_match('#^/users/toda-presidents/([a-f0-9-]+)$#', $path, $m)) {
        $creator = auth($pdo, $config);
        require_roles($creator, ['AUTHORIZED_PERSONNEL']);
        $data = input_json();
        $target = row($pdo, "SELECT id FROM users WHERE id = ? AND role = 'TODA_PRESIDENT'", [$m[1]]);
        if (!$target) fail(404, 'TODA President account not found.');
        $name = trim((string) ($data['fullName'] ?? ''));
        $email = strtolower(trim((string) ($data['email'] ?? '')));
        if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail(400, 'Full name and valid email are required.');
        $status = $data['status'] ?? null;
        if ($status !== null && !in_array($status, ['ACTIVE', 'INACTIVE'], true)) fail(400, 'Invalid account status.');
        $pdo->beginTransaction();
        if (!empty($data['todaId'])) {
            $toda = row($pdo, 'SELECT id, president_user_id FROM todas WHERE id = ? LIMIT 1', [(int) $data['todaId']]);
            if (!$toda) fail(404, 'TODA not found.');
            if (!empty($toda['president_user_id']) && $toda['president_user_id'] !== $m[1]) {
                fail(409, 'That TODA already has a different president account.');
            }
            $pdo->prepare('UPDATE todas SET president_user_id = NULL WHERE president_user_id = ? AND id <> ?')->execute([$m[1], (int) $data['todaId']]);
            $pdo->prepare('UPDATE todas SET president_user_id = ? WHERE id = ?')->execute([$m[1], (int) $data['todaId']]);
        }
        $stmt = $pdo->prepare('UPDATE users SET full_name = ?, email = ?, status = COALESCE(?, status) WHERE id = ?');
        $stmt->execute([$name, $email, $status, $m[1]]);
        if (!empty($data['password'])) { $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($data['password'], PASSWORD_DEFAULT), $m[1]]); }
        audit($pdo, $creator['id'], 'TODA_PRESIDENT_UPDATE', 'users', $m[1]);
        $pdo->commit();
        json_response(['ok' => true]);
    }

    if ($method === 'DELETE' && preg_match('#^/users/toda-presidents/([a-f0-9-]+)$#', $path, $m)) {
        $creator = auth($pdo, $config);
        require_roles($creator, ['AUTHORIZED_PERSONNEL']);
        $target = row($pdo, "SELECT id FROM users WHERE id = ? AND role = 'TODA_PRESIDENT'", [$m[1]]);
        if (!$target) fail(404, 'TODA President account not found.');
        $pdo->beginTransaction();
        $pdo->prepare('UPDATE todas SET president_user_id = NULL WHERE president_user_id = ?')->execute([$m[1]]);
        $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$m[1]]);
        audit($pdo, $creator['id'], 'TODA_PRESIDENT_DELETE', 'users', $m[1]);
        $pdo->commit();
        json_response(['ok' => true]);
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
        if ($creator['role'] === 'TODA_PRESIDENT') {
            $todaIds = user_toda_ids($pdo, $creator);
            if (!$todaIds) fail(403, 'Your account is not assigned to a TODA.');
            $todaId = $todaIds[0];
        } else {
            if (empty($data['todaId'])) fail(400, 'todaId is required.');
            $todaId = (int) $data['todaId'];
        }
        $toda = row($pdo, 'SELECT id FROM todas WHERE id = ? AND is_active = 1 LIMIT 1', [$todaId]);
        if (!$toda) fail(400, 'A valid active TODA is required.');
        $pdo->beginTransaction();
        $user = create_user($pdo, $data, 'DRIVER', $creator['id']);
        $stmt = $pdo->prepare('INSERT INTO drivers (user_id, toda_id, full_name, driver_code, tricycle_identifier, plate_number, route_area, contact_number, account_created_by, account_creation_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $user['id'],
            $todaId,
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
        $user = auth($pdo, $config);
        $profile = ['contactNumber' => $user['contact_number'] ?? null];
        if ($user['role'] === 'STUDENT') {
            $profile = array_merge($profile, row($pdo, 'SELECT student_id AS "studentId", program, year_level AS "yearLevel", campus FROM students WHERE user_id = ?', [$user['id']]) ?? []);
        } elseif ($user['role'] === 'DRIVER') {
            $profile = array_merge($profile, row($pdo, 'SELECT d.driver_code AS "driverCode", d.tricycle_identifier AS "tricycleIdentifier", d.route_area AS "routeArea", t.name AS "todaName", t.barangay, t.city, t.province FROM drivers d LEFT JOIN todas t ON t.id = d.toda_id WHERE d.user_id = ?', [$user['id']]) ?? []);
        }
        $preferences = row($pdo, 'SELECT report_updates AS updates, reminders FROM user_preferences WHERE user_id = ?', [$user['id']]) ?? ['updates' => 1, 'reminders' => 0];
        $preferences = ['updates' => (bool) $preferences['updates'], 'reminders' => (bool) $preferences['reminders']];
        json_response(['user' => public_user($user), 'profile' => $profile, 'preferences' => $preferences]);
    }

    if ($method === 'PATCH' && $path === '/me') {
        $user = auth($pdo, $config);
        $data = input_json();
        $name = trim((string) ($data['fullName'] ?? $user['full_name']));
        $email = strtolower(trim((string) ($data['email'] ?? $user['email'] ?? '')));
        if ($name === '') fail(400, 'Full name is required.');
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) fail(400, 'Use a valid email address.');
        $stmt = $pdo->prepare('UPDATE users SET full_name = ?, email = NULLIF(?, "") WHERE id = ?');
        $stmt->execute([$name, $email, $user['id']]);
        $updated = row($pdo, 'SELECT id, full_name, email, role, status FROM users WHERE id = ?', [$user['id']]);
        audit($pdo, $user['id'], 'PROFILE_UPDATE', 'users', $user['id']);
        json_response(['user' => public_user($updated)]);
    }

    if ($method === 'GET' && $path === '/me/photo') {
        $user = auth($pdo, $config);
        $record = row($pdo, 'SELECT profile_photo_path FROM users WHERE id = ?', [$user['id']]);
        if (!$record || empty($record['profile_photo_path']) || !is_file($record['profile_photo_path'])) fail(404, 'No profile photo has been uploaded.');
        $mimeByExtension = ['jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'];
        $mime = $mimeByExtension[strtolower(pathinfo($record['profile_photo_path'], PATHINFO_EXTENSION))] ?? 'application/octet-stream';
        header('Content-Type: ' . $mime);
        header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        readfile($record['profile_photo_path']);
        exit;
    }

    if ($method === 'POST' && $path === '/me/photo') {
        $user = auth($pdo, $config);
        $file = $_FILES['photo'] ?? null;
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) fail(400, 'Choose a profile image to upload.');
        if (($file['size'] ?? 0) > 5 * 1024 * 1024) fail(400, 'Profile images must be 5 MB or smaller.');
        $imageInfo = @getimagesize($file['tmp_name']);
        $mime = is_array($imageInfo) ? (string) ($imageInfo['mime'] ?? '') : '';
        $extensions = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
        if (!isset($extensions[$mime])) fail(400, 'Only JPG, PNG, and WEBP profile images are supported.');
        $directory = rtrim($config['upload_dir'], DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . 'profile-photos';
        if (!is_dir($directory) && !mkdir($directory, 0775, true) && !is_dir($directory)) fail(500, 'Unable to create profile photo storage.');
        $old = row($pdo, 'SELECT profile_photo_path FROM users WHERE id = ?', [$user['id']]);
        $path = $directory . DIRECTORY_SEPARATOR . $user['id'] . '-' . bin2hex(random_bytes(8)) . '.' . $extensions[$mime];
        if (!move_uploaded_file($file['tmp_name'], $path)) fail(500, 'Unable to save the profile image.');
        $stmt = $pdo->prepare('UPDATE users SET profile_photo_path = ? WHERE id = ?');
        $stmt->execute([$path, $user['id']]);
        if (!empty($old['profile_photo_path']) && is_file($old['profile_photo_path'])) @unlink($old['profile_photo_path']);
        audit($pdo, $user['id'], 'PROFILE_PHOTO_UPLOAD', 'users', $user['id'], ['mimeType' => $mime]);
        json_response(['ok' => true]);
    }

    if ($method === 'DELETE' && $path === '/me/photo') {
        $user = auth($pdo, $config);
        $old = row($pdo, 'SELECT profile_photo_path FROM users WHERE id = ?', [$user['id']]);
        $stmt = $pdo->prepare('UPDATE users SET profile_photo_path = NULL WHERE id = ?');
        $stmt->execute([$user['id']]);
        if (!empty($old['profile_photo_path']) && is_file($old['profile_photo_path'])) @unlink($old['profile_photo_path']);
        audit($pdo, $user['id'], 'PROFILE_PHOTO_DELETE', 'users', $user['id']);
        json_response(['ok' => true]);
    }

    if ($method === 'POST' && $path === '/me/password') {
        $user = auth($pdo, $config);
        $data = input_json();
        $currentPassword = (string) ($data['currentPassword'] ?? '');
        $newPassword = (string) ($data['newPassword'] ?? '');
        if (!password_verify($currentPassword, (string) $user['password_hash'])) fail(400, 'Current password is incorrect.');
        if (strlen($newPassword) < 8) fail(400, 'New password must be at least 8 characters.');
        $stmt = $pdo->prepare('UPDATE users SET password_hash = ? WHERE id = ?');
        $stmt->execute([password_hash($newPassword, PASSWORD_DEFAULT), $user['id']]);
        audit($pdo, $user['id'], 'PASSWORD_UPDATE', 'users', $user['id']);
        json_response(['ok' => true]);
    }

    if ($method === 'PATCH' && $path === '/me/preferences') {
        $user = auth($pdo, $config);
        $data = input_json();
        $updates = !empty($data['updates']) ? 1 : 0;
        $reminders = !empty($data['reminders']) ? 1 : 0;
        $preferenceSql = is_postgres($pdo)
            ? 'INSERT INTO user_preferences (user_id, report_updates, reminders) VALUES (?, ?, ?) ON CONFLICT (user_id) DO UPDATE SET report_updates = EXCLUDED.report_updates, reminders = EXCLUDED.reminders'
            : 'INSERT INTO user_preferences (user_id, report_updates, reminders) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE report_updates = VALUES(report_updates), reminders = VALUES(reminders)';
        $stmt = $pdo->prepare($preferenceSql);
        $stmt->execute([$user['id'], $updates, $reminders]);
        json_response(['preferences' => ['updates' => (bool) $updates, 'reminders' => (bool) $reminders]]);
    }

    if ($method === 'GET' && $path === '/admin/directory') {
        $admin = auth($pdo, $config);
        require_roles($admin, ['SUPERADMIN']);
        $students = $pdo->query("SELECT u.id, u.full_name AS \"fullName\", u.email, u.status, u.created_at AS \"createdAt\", s.student_id AS \"studentId\", s.program, s.year_level AS \"yearLevel\", s.campus FROM users u JOIN students s ON s.user_id = u.id WHERE u.role = 'STUDENT' ORDER BY u.created_at DESC")->fetchAll();
        $drivers = $pdo->query("SELECT u.id, u.full_name AS \"fullName\", u.email, u.status, u.created_at AS \"createdAt\", d.driver_code AS \"driverCode\", d.tricycle_identifier AS \"tricycleIdentifier\", d.route_area AS \"routeArea\", t.name AS \"todaName\" FROM drivers d LEFT JOIN users u ON u.id = d.user_id JOIN todas t ON t.id = d.toda_id ORDER BY d.created_at DESC")->fetchAll();
        $personnel = $pdo->query("SELECT u.id, u.full_name AS \"fullName\", u.email, u.role, u.status, u.created_at AS \"createdAt\", p.personnel_type AS \"personnelType\", p.office_name AS \"officeName\", p.position_title AS \"positionTitle\" FROM users u JOIN authorized_personnel p ON p.user_id = u.id WHERE u.role IN ('AUTHORIZED_PERSONNEL','PNP') ORDER BY u.created_at DESC")->fetchAll();
        $presidents = $pdo->query("SELECT u.id, u.full_name AS \"fullName\", u.email, u.status, u.created_at AS \"createdAt\", t.id AS \"todaId\", t.name AS \"todaName\" FROM users u JOIN todas t ON t.president_user_id = u.id WHERE u.role = 'TODA_PRESIDENT' ORDER BY u.created_at DESC")->fetchAll();
        json_response(['students' => $students, 'drivers' => $drivers, 'personnel' => $personnel, 'presidents' => $presidents]);
    }

    if ($method === 'DELETE' && preg_match('#^/admin/users/([a-f0-9-]+)$#', $path, $m)) {
        $admin = auth($pdo, $config);
        require_roles($admin, ['SUPERADMIN']);
        if ($m[1] === $admin['id']) fail(400, 'The active superadmin account cannot be deleted.');
        $target = row($pdo, 'SELECT id, role, status FROM users WHERE id = ? LIMIT 1', [$m[1]]);
        if (!$target) fail(404, 'Account not found.');
        if ($target['role'] === 'SUPERADMIN') fail(403, 'Superadmin accounts cannot be deleted.');
        $pdo->beginTransaction();
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$target['id']]);
        audit($pdo, $admin['id'], 'USER_DELETE', 'users', $target['id']);
        $pdo->commit();
        json_response(['ok' => true, 'status' => 'DELETED']);
    }

    if ($method === 'GET' && $path === '/admin/dashboard') {
        $admin = auth($pdo, $config);
        require_roles($admin, ['SUPERADMIN']);
        $stats = [
            'totalUsers' => (int) $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
            'students' => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'STUDENT'")->fetchColumn(),
            'personnel' => (int) $pdo->query("SELECT COUNT(*) FROM users WHERE role = 'AUTHORIZED_PERSONNEL'")->fetchColumn(),
            'drivers' => (int) $pdo->query("SELECT COUNT(*) FROM drivers WHERE is_active = 1")->fetchColumn(),
            'reports' => (int) $pdo->query("SELECT COUNT(*) FROM complaints")->fetchColumn(),
            'pendingReports' => (int) $pdo->query("SELECT COUNT(*) FROM complaints WHERE status IN ('SUBMITTED','RECEIVED','UNDER_REVIEW','REFERRED')")->fetchColumn(),
            'resolvedReports' => (int) $pdo->query("SELECT COUNT(*) FROM complaints WHERE status IN ('RESOLVED','CLOSED')")->fetchColumn(),
            'violations' => (int) $pdo->query("SELECT COUNT(*) FROM violations")->fetchColumn(),
        ];
        $reports = $pdo->query("SELECT c.reference_number AS id, c.location, cat.name AS category, c.status, c.created_at AS received, d.tricycle_identifier AS reference, LEFT(c.description, 120) AS subject FROM complaints c JOIN complaint_categories cat ON cat.id = c.category_id JOIN drivers d ON d.id = c.driver_id ORDER BY c.created_at DESC LIMIT 50")->fetchAll();
        $activity = $pdo->query("SELECT a.action, a.target_type AS \"targetType\", a.created_at AS \"createdAt\", COALESCE(u.full_name, 'System') AS actor FROM audit_logs a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.created_at DESC LIMIT 25")->fetchAll();
        json_response(['stats' => $stats, 'reports' => $reports, 'activity' => $activity]);
    }

    if ($method === 'GET' && $path === '/drivers') {
        auth($pdo, $config);
        $search = '%' . ($_GET['search'] ?? '') . '%';
        $stmt = $pdo->prepare('SELECT d.id, d.full_name AS "fullName", d.driver_code AS "driverCode", d.tricycle_identifier AS "tricycleIdentifier", d.plate_number AS "plateNumber", d.route_area AS "routeArea", d.contact_number AS "contactNumber", d.is_active AS "isActive", (SELECT COUNT(*) FROM complaints c WHERE c.driver_id = d.id) AS "reportCount", (SELECT COUNT(*) FROM violations v WHERE v.driver_id = d.id) AS "confirmedViolationCount" FROM drivers d WHERE d.is_active = 1 AND (d.full_name LIKE ? OR d.driver_code LIKE ? OR d.tricycle_identifier LIKE ?) ORDER BY d.full_name LIMIT 100');
        $stmt->execute([$search, $search, $search]);
        json_response(['drivers' => $stmt->fetchAll()]);
    }

    if ($method === 'GET' && preg_match('#^/drivers/(\d+)$#', $path, $m)) {
        $user = auth($pdo, $config);
        require_roles($user, ['AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $driver = row($pdo, 'SELECT id, full_name AS "fullName", driver_code AS "driverCode" FROM drivers WHERE id = ? AND is_active = 1', [(int) $m[1]]);
        if (!$driver) fail(404, 'Driver not found.');
        $dateFormat = is_postgres($pdo) ? "TO_CHAR(c.incident_date, 'DD Mon YYYY')" : "DATE_FORMAT(c.incident_date, '%d %b %Y')";
        $reports = rows($pdo, "SELECT c.reference_number AS id, {$dateFormat} AS date, cat.name AS category, LEFT(c.description, 180) AS summary, c.status FROM complaints c JOIN complaint_categories cat ON cat.id = c.category_id WHERE c.driver_id = ? ORDER BY c.created_at DESC", [(int) $m[1]]);
        $violationDateFormat = is_postgres($pdo) ? "TO_CHAR(v.confirmation_date, 'DD Mon YYYY')" : "DATE_FORMAT(v.confirmation_date, '%d %b %Y')";
        $confirmedViolationText = is_postgres($pdo) ? "'Confirmed violation'" : '"Confirmed violation"';
        $violations = rows($pdo, "SELECT " . (is_postgres($pdo) ? "'VIO-' || v.id::text" : 'CONCAT("VIO-", v.id)') . " AS reference, {$violationDateFormat} AS date, v.violation_category AS finding, COALESCE(v.remarks, {$confirmedViolationText}) AS action FROM violations v WHERE v.driver_id = ? ORDER BY v.confirmation_date DESC", [(int) $m[1]]);
        json_response(['driver' => $driver, 'reports' => $reports, 'violations' => $violations]);
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
        try {
            notify($pdo, $user['id'], 'COMPLAINT_SUBMITTED', "Complaint $reference was submitted.", $complaintId);
            notify_officers($pdo, 'NEW_COMPLAINT', "New complaint $reference requires review.", $complaintId);
        } catch (Throwable $notificationError) {
            error_log('Complaint notification failed after successful submission: ' . $notificationError->getMessage());
        }
        json_response(['complaint' => ['id' => $complaintId, 'referenceNumber' => $reference, 'status' => 'SUBMITTED']], 201);
    }

    if ($method === 'GET' && $path === '/complaints') {
        $user = auth($pdo, $config);
        $where = [];
        $params = [];
        if ($user['role'] === 'STUDENT') {
            $where[] = 'student_user_id = ?';
            $params[] = $user['id'];
        } elseif ($user['role'] === 'DRIVER') {
            $where[] = 'c.driver_id IN (SELECT id FROM drivers WHERE user_id = ?)';
            $params[] = $user['id'];
        } elseif ($user['role'] === 'TODA_PRESIDENT') {
            $todaIds = user_toda_ids($pdo, $user);
            if (!$todaIds) {
                json_response(['complaints' => []]);
            }
            $where[] = 'd.toda_id IN (' . implode(',', array_fill(0, count($todaIds), '?')) . ')';
            array_push($params, ...$todaIds);
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
        $sql = "SELECT c.id, c.reference_number AS \"referenceNumber\", c.status, c.driver_id AS \"driverId\", d.full_name AS \"driverName\", c.category_id AS \"categoryId\", cat.name AS \"categoryName\", c.incident_date AS \"incidentDate\", c.incident_time AS \"incidentTime\", c.location, c.description, c.created_at AS \"createdAt\", (SELECT MAX(h.created_at) FROM complaint_status_history h WHERE h.complaint_id = c.id AND h.new_status IN ('RESOLVED', 'CLOSED')) AS \"resolvedAt\" FROM complaints c JOIN drivers d ON d.id = c.driver_id JOIN complaint_categories cat ON cat.id = c.category_id";
        if ($where) $sql .= ' WHERE ' . implode(' AND ', $where);
        $sql .= ' ORDER BY c.created_at DESC LIMIT 100';
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
        $complaint = complaint_or_404($pdo, $m[1], $user);
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
        require_roles($user, ['AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $data = input_json();
        if (empty($data['actionType']) || empty($data['description'])) fail(400, 'Action type and description are required.');
        $complaint = complaint_or_404($pdo, $m[1], $user);
        $stmt = $pdo->prepare('INSERT INTO complaint_actions (complaint_id, action_type, description, action_taken_by) VALUES (?, ?, ?, ?)');
        $stmt->execute([$complaint['id'], $data['actionType'], $data['description'], $user['id']]);
        $actionId = last_insert_id($pdo, 'complaint_actions_id_seq');
        audit($pdo, $user['id'], 'COMPLAINT_ACTION_CREATE', 'complaint_actions', $actionId, ['complaintId' => $complaint['id']]);
        notify($pdo, $complaint['student_user_id'], 'COMPLAINT_ACTION_RECORDED', 'An action was recorded for complaint ' . $complaint['reference_number'] . '.', $complaint['id']);
        json_response(['action' => ['id' => (int) $actionId]], 201);
    }

    if ($method === 'POST' && preg_match('#^/complaints/([a-f0-9-]+)/violations$#', $path, $m)) {
        $user = auth($pdo, $config);
        require_roles($user, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        $data = input_json();
        $complaint = complaint_or_404($pdo, $m[1], $user);
        if (!in_array($complaint['status'], ['VERIFIED', 'RESOLVED', 'CLOSED'], true)) fail(400, 'A confirmed violation can only be recorded after appropriate review.');
        $existing = row($pdo, 'SELECT id FROM violations WHERE complaint_id = ? LIMIT 1', [$complaint['id']]);
        if ($existing) fail(409, 'A violation has already been recorded for this report.');
        $stmt = $pdo->prepare('INSERT INTO violations (driver_id, complaint_id, violation_category, description, confirmed_by, remarks) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$complaint['driver_id'], $complaint['id'], $data['violationCategory'] ?? '', $data['description'] ?? '', $user['id'], $data['remarks'] ?? null]);
        $violationId = last_insert_id($pdo, 'violations_id_seq');
        audit($pdo, $user['id'], 'VIOLATION_CREATE', 'violations', $violationId, ['complaintId' => $complaint['id']]);
        json_response(['violation' => ['id' => (int) $violationId]], 201);
    }

    if ($method === 'GET' && $path === '/notifications') {
        $user = auth($pdo, $config);
        $stmt = $pdo->prepare('SELECT n.id, n.type, n.message, n.related_complaint_id AS "relatedComplaintId", c.reference_number AS "reportReference", n.read_at AS "readAt", n.created_at AS "createdAt" FROM notifications n LEFT JOIN complaints c ON c.id = n.related_complaint_id WHERE n.recipient_user_id = ? ORDER BY n.created_at DESC LIMIT 100');
        $stmt->execute([$user['id']]);
        $rows = $stmt->fetchAll();
        json_response(['notifications' => $rows, 'unread' => count(array_filter($rows, fn($row) => $row['readAt'] === null))]);
    }

    if ($method === 'GET' && $path === '/violations') {
        $user = auth($pdo, $config);
        require_roles($user, ['DRIVER', 'TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        if ($user['role'] === 'DRIVER') {
            $stmt = $pdo->prepare("SELECT v.id, v.complaint_id AS \"complaintId\", d.full_name AS driver, c.reference_number AS \"relatedReport\", v.violation_category AS type, DATE(v.confirmation_date) AS \"dateValue\", v.description AS summary, COALESCE(v.remarks, '') AS action FROM violations v JOIN drivers d ON d.id = v.driver_id JOIN complaints c ON c.id = v.complaint_id WHERE d.user_id = ? ORDER BY v.confirmation_date DESC LIMIT 100");
            $stmt->execute([$user['id']]);
            $rows = $stmt->fetchAll();
        } elseif ($user['role'] === 'TODA_PRESIDENT') {
            $todaIds = user_toda_ids($pdo, $user);
            if (!$todaIds) json_response(['violations' => []]);
            $stmt = $pdo->prepare("SELECT v.id, v.complaint_id AS \"complaintId\", d.full_name AS driver, c.reference_number AS \"relatedReport\", v.violation_category AS type, DATE(v.confirmation_date) AS \"dateValue\", v.description AS summary, COALESCE(v.remarks, '') AS action FROM violations v JOIN drivers d ON d.id = v.driver_id JOIN complaints c ON c.id = v.complaint_id WHERE d.toda_id IN (" . implode(',', array_fill(0, count($todaIds), '?')) . ") ORDER BY v.confirmation_date DESC LIMIT 100");
            $stmt->execute($todaIds);
            $rows = $stmt->fetchAll();
        } else {
            $rows = $pdo->query("SELECT v.id, v.complaint_id AS \"complaintId\", d.full_name AS driver, c.reference_number AS \"relatedReport\", v.violation_category AS type, DATE(v.confirmation_date) AS \"dateValue\", v.description AS summary, COALESCE(v.remarks, '') AS action FROM violations v JOIN drivers d ON d.id = v.driver_id JOIN complaints c ON c.id = v.complaint_id ORDER BY v.confirmation_date DESC LIMIT 100")->fetchAll();
        }
        json_response(['violations' => $rows]);
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
        [$scopeJoin, $scopeWhere, $scopeParams] = complaint_scope_sql($pdo, $user);
        $byStatus = rows($pdo, 'SELECT c.status, COUNT(*) AS total FROM complaints c' . $scopeJoin . $scopeWhere . ' GROUP BY c.status', $scopeParams);
        $violations = row($pdo, 'SELECT COUNT(*) AS total FROM violations v JOIN complaints c ON c.id = v.complaint_id' . $scopeJoin . $scopeWhere, $scopeParams);
        json_response(['byStatus' => $byStatus, 'confirmedViolations' => (int) $violations['total']]);
    }

    if ($method === 'GET' && $path === '/reports/summary') {
        $user = auth($pdo, $config);
        require_roles($user, ['TODA_PRESIDENT', 'AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP']);
        [$scopeJoin, $scopeWhere, $scopeParams] = complaint_scope_sql($pdo, $user, 'r');
        $byStatus = rows($pdo, 'SELECT r.status AS label, COUNT(*) AS total FROM complaints r' . $scopeJoin . $scopeWhere . ' GROUP BY r.status', $scopeParams);
        $byCategory = rows($pdo, 'SELECT cc.name AS label, COUNT(*) AS total FROM complaints r JOIN complaint_categories cc ON cc.id = r.category_id' . $scopeJoin . $scopeWhere . ' GROUP BY cc.name', $scopeParams);
        $monthlyExpression = is_postgres($pdo) ? "TO_CHAR(r.created_at, 'YYYY-MM')" : "DATE_FORMAT(r.created_at, '%Y-%m')";
        $monthly = rows($pdo, "SELECT {$monthlyExpression} AS label, COUNT(*) AS total FROM complaints r" . $scopeJoin . $scopeWhere . " GROUP BY {$monthlyExpression}", $scopeParams);
        json_response(['byStatus' => $byStatus, 'byCategory' => $byCategory, 'monthly' => $monthly]);
    }

    if ($method === 'POST' && $path === '/seed') {
        $user = auth($pdo, $config);
        require_roles($user, ['SUPERADMIN']);
        seed($pdo);
        json_response(['ok' => true, 'seededPassword' => 'Password123!']);
    }

    fail(404, 'Route not found.');
} catch (PDOException $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    // Registration commonly reaches this branch when the email or student/driver
    // identifier has already been used. Return a useful client-facing message
    // instead of hiding the constraint violation behind a generic 500.
    if (in_array((string) $e->getCode(), ['23000', '23505'], true)) {
        $detail = strtolower($e->getMessage());
        if (str_contains($detail, 'email')) fail(409, 'An account with this email already exists. Sign in or use another email.');
        if (str_contains($detail, 'student_id')) fail(409, 'This student ID is already registered. Use another student ID.');
        if (str_contains($detail, 'driver_code')) fail(409, 'This driver code is already registered. Use another driver code.');
        if (str_contains($detail, 'tricycle_identifier')) fail(409, 'This tricycle identifier is already registered. Use another identifier.');
        if (str_contains($detail, 'toda_id') || str_contains($detail, 'drivers_toda_fk')) fail(400, 'No valid designated location is available for this driver. Ask Authorized Personnel to create a location first.');
        fail(409, 'This account information is already registered. Check your details and try again.');
    }
    fail(500, 'Database request failed.');
} catch (Throwable $e) {
    if ($pdo instanceof PDO && $pdo->inTransaction()) $pdo->rollBack();
    error_log($e->getMessage() . " in $method $path");
    fail(500, 'The request could not be completed.');
}

function user_toda_ids(PDO $pdo, array $user): array {
    if ($user['role'] !== 'TODA_PRESIDENT') return [];
    $stmt = $pdo->prepare('SELECT id FROM todas WHERE president_user_id = ? AND is_active = 1 ORDER BY id');
    $stmt->execute([$user['id']]);
    return array_map('intval', array_column($stmt->fetchAll(), 'id'));
}

function complaint_scope_sql(PDO $pdo, array $user, string $complaintAlias = 'c'): array {
    if ($user['role'] !== 'TODA_PRESIDENT') return ['', '', []];
    $todaIds = user_toda_ids($pdo, $user);
    if (!$todaIds) return [' JOIN drivers d ON d.id = ' . $complaintAlias . '.driver_id', ' WHERE 1 = 0', []];
    return [
        ' JOIN drivers d ON d.id = ' . $complaintAlias . '.driver_id',
        ' WHERE d.toda_id IN (' . implode(',', array_fill(0, count($todaIds), '?')) . ')',
        $todaIds,
    ];
}

function can_access_complaint(PDO $pdo, array $complaint, array $user): bool {
    if ($user['role'] === 'STUDENT') {
        return $complaint['student_user_id'] === $user['id'];
    }
    if ($user['role'] === 'DRIVER') {
        return row($pdo, 'SELECT id FROM drivers WHERE id = ? AND user_id = ? LIMIT 1', [(int) $complaint['driver_id'], $user['id']]) !== null;
    }
    if ($user['role'] === 'TODA_PRESIDENT') {
        return row(
            $pdo,
            'SELECT d.id FROM drivers d JOIN todas t ON t.id = d.toda_id WHERE d.id = ? AND t.president_user_id = ? AND t.is_active = 1 LIMIT 1',
            [(int) $complaint['driver_id'], $user['id']]
        ) !== null;
    }
    return in_array($user['role'], ['AUTHORIZED_PERSONNEL', 'SUPERADMIN', 'PNP'], true);
}

function complaint_or_404(PDO $pdo, string $id, array $user): array {
    $stmt = $pdo->prepare('SELECT * FROM complaints WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $complaint = $stmt->fetch();
    if (!$complaint) fail(404, 'Complaint not found.');
    if (!can_access_complaint($pdo, $complaint, $user)) {
        fail(403, 'You are not authorized to view this complaint.');
    }
    return $complaint;
}

function complaint_details(PDO $pdo, array $complaint): array {
    $driver = row($pdo, 'SELECT * FROM drivers WHERE id = ?', [$complaint['driver_id']]);
    $category = row($pdo, 'SELECT * FROM complaint_categories WHERE id = ?', [$complaint['category_id']]);
    $history = rows($pdo, 'SELECT * FROM complaint_status_history WHERE complaint_id = ? ORDER BY created_at', [$complaint['id']]);
    $actions = rows($pdo, 'SELECT a.*, u.full_name AS "authorName", u.role AS "authorRole" FROM complaint_actions a LEFT JOIN users u ON u.id = a.action_taken_by WHERE a.complaint_id = ? ORDER BY a.created_at DESC', [$complaint['id']]);
    $attachments = rows($pdo, 'SELECT id, original_name AS "originalName", mime_type AS "mimeType", size_bytes AS "sizeBytes", created_at AS "createdAt" FROM complaint_attachments WHERE complaint_id = ?', [$complaint['id']]);
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
        $reportedMime = is_array($files['type']) ? (string) $files['type'][$i] : (string) $files['type'];
        $mime = function_exists('mime_content_type') ? (mime_content_type($tmp) ?: $reportedMime) : $reportedMime;
        if ($mime === '') $mime = 'application/octet-stream';
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

    if (is_postgres($pdo)) {
        $pdo->exec("INSERT INTO todas (id, name, barangay, city, province, president_user_id) VALUES (1, 'Old Sagay TODA', 'Old Sagay', 'Sagay City', 'Negros Occidental', NULL) ON CONFLICT (id) DO NOTHING");
        $pdo->exec("SELECT setval('todas_id_seq', GREATEST((SELECT COALESCE(MAX(id), 1) FROM todas), 1), true)");
    } else {
        $pdo->exec("INSERT IGNORE INTO todas (id, name, barangay, city, province, president_user_id) VALUES (1, 'Old Sagay TODA', 'Old Sagay', 'Sagay City', 'Negros Occidental', NULL)");
    }
    foreach (['Overcharging', 'Reckless Driving', 'Refusal to Transport', 'Discourteous Behavior', 'Unsafe Driving', 'Vehicle Condition', 'Other'] as $name) {
        $stmt = $pdo->prepare(is_postgres($pdo)
            ? 'INSERT INTO complaint_categories (name) VALUES (?) ON CONFLICT (name) DO NOTHING'
            : 'INSERT IGNORE INTO complaint_categories (name) VALUES (?)');
        $stmt->execute([$name]);
    }
}

function seed_user(PDO $pdo, string $id, string $name, ?string $email, ?string $username, string $role, ?string $createdBy): void {
    $stmt = $pdo->prepare('SELECT id FROM users WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->fetch()) return;
    $stmt = $pdo->prepare('INSERT INTO users (id, full_name, email, username, password_hash, role, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
    $stmt->execute([$id, $name, $email, $username, password_hash('Password123!', PASSWORD_DEFAULT), $role, $createdBy]);
}

<?php
declare(strict_types=1);

// Safe first-run bootstrap for local MySQL only. Existing non-empty databases
// are never reset or seeded by this script.
$configPath = __DIR__ . '/config.php';
$config = file_exists($configPath) ? require $configPath : require __DIR__ . '/config.example.php';
$driver = strtolower((string) ($config['db_driver'] ?? 'mysql'));

if ($driver !== 'mysql') {
    fwrite(STDOUT, "Database bootstrap skipped for {$driver}; provision that database separately.\n");
    exit(0);
}

$host = (string) ($config['db_host'] ?? '127.0.0.1');
if (!in_array(strtolower($host), ['127.0.0.1', 'localhost', '::1'], true)) {
    fwrite(STDOUT, "Database bootstrap skipped for non-local MySQL host {$host}; provision it separately.\n");
    exit(0);
}

$databaseName = (string) ($config['db_name'] ?? 'tricycle_conduct');
if (!preg_match('/^[A-Za-z0-9_$-]{1,64}$/', $databaseName)) {
    fwrite(STDERR, "Invalid db_name in api-php/config.php; use 1–64 letters, numbers, underscores, or hyphens.\n");
    exit(1);
}

try {
    $port = (int) ($config['db_port'] ?? 3306);
    $server = new PDO(
        "mysql:host={$host};port={$port};charset=utf8mb4",
        (string) ($config['db_user'] ?? 'root'),
        (string) ($config['db_pass'] ?? ''),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    $exists = $server->prepare('SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?');
    $exists->execute([$databaseName]);
    $databaseExists = (bool) $exists->fetchColumn();
    $quotedDatabase = '`' . str_replace('`', '``', $databaseName) . '`';

    if (!$databaseExists) {
        $server->exec("CREATE DATABASE {$quotedDatabase} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        fwrite(STDOUT, "Created local database '{$databaseName}'.\n");
    }

    $database = new PDO(
        "mysql:host={$host};port={$port};dbname={$databaseName};charset=utf8mb4",
        (string) ($config['db_user'] ?? 'root'),
        (string) ($config['db_pass'] ?? ''),
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $tables = (int) $database->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn();

    if ($tables > 0) {
        fwrite(STDOUT, "Database '{$databaseName}' already has {$tables} table(s); left it unchanged.\n");
        exit(0);
    }

    $schema = file_get_contents(__DIR__ . '/schema.mysql.sql');
    $seed = file_get_contents(__DIR__ . '/seed.mysql.sql');
    if ($schema === false || $seed === false) {
        throw new RuntimeException('Could not read the local MySQL schema or seed file.');
    }

    // The schema file contains destructive DROP statements for manual resets.
    // Skip those here: bootstrap only runs when the target database is empty.
    $schema = preg_replace('/^\s*(?:CREATE DATABASE IF NOT EXISTS\b[^;]*|USE\s+[^;]+|DROP TABLE IF EXISTS\s+[^;]+);\s*$/mi', '', $schema);
    $seed = preg_replace('/^\s*USE\s+[^;]+;\s*$/mi', '', $seed);
    foreach ([$schema, $seed] as $sqlFile) {
        $statements = preg_split('/;\s*(?:\r?\n|$)/', $sqlFile) ?: [];
        foreach ($statements as $statement) {
            if (trim($statement) !== '') $database->exec($statement);
        }
    }

    $tables = (int) $database->query('SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()')->fetchColumn();
    if ($tables === 0) throw new RuntimeException('Schema setup completed without creating any tables.');
    fwrite(STDOUT, "Initialized '{$databaseName}' with {$tables} tables and the starter account.\n");
} catch (Throwable $error) {
    fwrite(STDERR, "Local database setup failed: {$error->getMessage()}\n");
    fwrite(STDERR, "Check that MySQL is running and api-php/config.php has the correct local credentials.\n");
    exit(1);
}

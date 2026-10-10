<?php
declare(strict_types=1);

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

// Evidence and profile uploads are private API data, never public static files.
if (preg_match('#^/storage(?:/|$)#i', $requestPath)) {
    http_response_code(404);
    exit;
}

// Only the API entry point may be executed directly by the built-in server.
if (preg_match('#\.php(?:/|$)#i', $requestPath) && !preg_match('#^/index\.php(?:/|$)#i', $requestPath)) {
    http_response_code(404);
    exit;
}

$_SERVER['SCRIPT_NAME'] = '/index.php';
$_SERVER['SCRIPT_FILENAME'] = __DIR__ . DIRECTORY_SEPARATOR . 'index.php';
require __DIR__ . DIRECTORY_SEPARATOR . 'index.php';

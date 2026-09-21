<?php
// Copy this file to api-php/config.php on the hosted PHP server.
// Get the database host, password, and port from Supabase Project Settings.
return [
    'db_driver' => 'pgsql',
    'db_host' => 'db.your-project-ref.supabase.co',
    'db_port' => 5432,
    'db_name' => 'postgres',
    'db_user' => 'postgres',
    'db_pass' => 'replace-with-your-supabase-database-password',
    'db_sslmode' => 'require',
    'jwt_secret' => 'replace-with-a-long-random-production-secret',
    'upload_dir' => __DIR__ . '/storage/uploads',
    'frontend_origin' => 'https://your-frontend-domain.example',
];

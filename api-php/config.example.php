<?php
return [
    'db_driver' => 'mysql',
    'db_host' => '127.0.0.1',
    'db_name' => 'tricycle_conduct',
    'db_user' => 'root',
    'db_pass' => '',
    'jwt_secret' => 'change-this-local-secret',
    'upload_dir' => dirname(__DIR__) . '/private-storage/uploads',
    'frontend_origin' => '*',
];

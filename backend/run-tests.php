<?php
// Simple test runner script
require __DIR__ . '/vendor/autoload.php';

// Set environment
putenv('APP_ENV=testing');

// Include Pest
use PHPUnit\TextUI\Command;

// Run tests with PHPUnit directly
$command = new Command();
exit($command->run(['phpunit', '-c', 'phpunit.xml']));

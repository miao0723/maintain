<?php

use Pest\PestPlugins\OnlyPlugin;

pest()->extend(OnlyPlugin::class);

// Test suite configuration
pest()->beforeEach(function () {
    // Setup test environment
    putenv('APP_ENV=testing');
});

pest()->afterEach(function () {
    // Cleanup after tests
});

// Configure test directories
pest()->folders([
    'tests/Feature',
    'tests/Unit',
]);

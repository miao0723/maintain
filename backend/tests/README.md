# Testing Framework Setup

## Installation

Pest PHP testing framework is configured but not yet installed. To install:

```bash
cd backend
composer require pestphp/pest --dev
composer require pestphp/pest-plugin-mock --dev
```

## Running Tests

### Run all tests:
```bash
./vendor/bin/pest
```

### Run specific test file:
```bash
./vendor/bin/pest tests/Feature/AuthTest.php
```

### Run with coverage:
```bash
./vendor/bin/pest --coverage
```

## Test Structure

- `tests/Feature/` - API endpoint tests
  - `AuthTest.php` - Authentication endpoint tests
  - `DepartmentTest.php` - Department API tests
- `tests/Unit/` - Unit tests
  - `ExampleTest.php` - Example unit tests
- `BaseTestCase.php` - Base test class with HTTP helper methods

## Prerequisites

1. Backend server must be running on `http://localhost:8000`
2. Database should have test data (admin user with username: admin, password: admin123)
3. JWT/Pest dependencies installed via Composer

## Configuration

- `phpunit.xml` - PHPUnit configuration (Pest compatible)
- `pest.php` - Pest-specific configuration

## Notes

- Tests use curl to make HTTP requests to the running API
- Authentication tests use the simple login endpoint
- Tests are designed to be run against a local development environment

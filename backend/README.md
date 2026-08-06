# CMMS Backend - Phase 1

## Setup Instructions

### Using Docker

1. Clone repository
```bash
git clone <repository-url>
cd maintain
```

2. Start containers
```bash
docker-compose up -d
```

3. Run migrations
```bash
docker-compose exec php bash
php think migrate:run
php think seed:run
```

4. Access API
```
Base URL: http://localhost/api/v1
```

### Default Admin Account
- Username: `admin`
- Password: `admin123`

### Environment Configuration

Copy `.env.example` to `.env` and configure:
- Database connection
- Redis connection
- JWT secret key

## Running Tests

```bash
docker-compose exec php bash
composer test
```

## API Documentation

See `docs/api/phase1-auth-api.md`
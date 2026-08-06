# Phase 2: Device Asset Management - Design Specification

**Date:** 2026-03-19
**Status:** Approved
**Dependencies:** Phase 1: Authentication & Authorization Infrastructure

---

## Overview

Implement the device asset management module as the second phase of the CMMS system. This module provides CRUD operations for device management, serving as the foundation for maintenance workflows.

### Scope Decisions

| Decision Choice | Selection | Rationale |
|----------------|-----------|-----------|
| Department Relationship | Many-to-one (device → department) | Simpler, sufficient for most use cases |
| Data Entry | Web admin only | Initial phase focuses on administrative management |
| Classification | Two-level flat | Adequate for current requirements |
| Status Management | Automatic flow | Triggered by work order creation/completion |
| QR Codes | Excluded | Not in PDF requirements per user feedback |
| Search/Filter | Basic list | Core functionality first |
| Information Depth | Core fields only | 10 essential fields defined below |

---

## Data Model

### devices Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Device ID |
| device_code | VARCHAR(50) | NOT NULL, UNIQUE | Device code |
| device_name | VARCHAR(100) | NOT NULL | Device name |
| model | VARCHAR(100) | NULL | Model specification |
| category_id | INT UNSIGNED | NOT NULL, FK → device_categories.id | Category |
| department_id | INT UNSIGNED | NOT NULL, FK → departments.id | Owning department |
| location | VARCHAR(200) | NULL | Physical location |
| purchase_date | DATE | NULL | Purchase date |
| warranty_date | DATE | NULL | Warranty expiration |
| status | TINYINT | NOT NULL, DEFAULT 1 | 1=正常, 2=维修中, 3=停用 |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | NULL | Last update |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (device_code)
- INDEX (category_id)
- INDEX (department_id)
- INDEX (status)

### device_categories Table

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | INT UNSIGNED | PK, AUTO_INCREMENT | Category ID |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Category name |
| icon | VARCHAR(100) | NULL | Icon identifier |
| created_at | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Creation time |

**Indexes:**
- PRIMARY KEY (id)
- UNIQUE KEY (name)

---

## Relationships

```
Device ──→ Department (many-to-one)
Device ──→ DeviceCategory (many-to-one)
Device ←─ WorkOrder (one-to-many, future phase)
```

---

## API Endpoints

### Device Management

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/devices | List devices with pagination | devices:view |
| POST | /api/devices | Create device | devices:create |
| GET | /api/devices/{id} | Get device details | devices:view |
| PUT | /api/devices/{id} | Update device | devices:update |
| DELETE | /api/devices/{id} | Delete device | devices:delete |
| GET | /api/devices/{id}/history | Get device maintenance history | devices:view |

### Category Management

| Method | Endpoint | Description | Permission |
|--------|----------|-------------|------------|
| GET | /api/devices/categories | List categories | devices:view |
| POST | /api/devices/categories | Create category | devices:create |
| PUT | /api/devices/categories/{id} | Update category | devices:update |
| DELETE | /api/devices/categories/{id} | Delete category | devices:delete |

---

## Business Rules

### Status Flow

```
正常 (1) ──[Work Order Created]──→ 维修中 (2)
维修中 (2) ──[Work Order Completed]──→ 正常 (1)
任何状态 ──[Admin action]──→ 停用 (3)
```

### Validation Rules

- **device_code**: Required, unique, max 50 characters
- **device_name**: Required, max 100 characters
- **category_id**: Must reference existing category
- **department_id**: Must reference existing department
- **purchase_date**: Valid date format if provided
- **warranty_date**: Valid date format if provided, must be after purchase_date if both provided

### Deletion Constraints

- Category cannot be deleted if devices reference it
- Device cannot be deleted if it has associated work orders (future phase)

---

## Response Format

All endpoints follow the unified response format defined in Phase 1:

```json
{
  "code": 200,
  "message": "success",
  "data": { ... }
}
```

### List Response (GET /api/devices)

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "device_code": "DEV001",
        "device_name": "离心泵",
        "model": "IS50-32-125",
        "category": {
          "id": 1,
          "name": "泵类"
        },
        "department": {
          "id": 1,
          "name": "生产部"
        },
        "location": "车间A区",
        "purchase_date": "2024-01-15",
        "warranty_date": "2026-01-15",
        "status": 1
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

---

## File Structure

```
backend/
├── app/
│   ├── controller/
│   │   ├── DeviceController.php       # Device CRUD endpoints
│   │   └── DeviceCategoryController.php  # Category CRUD endpoints
│   ├── model/
│   │   ├── Device.php                  # Device model with relationships
│   │   └── DeviceCategory.php          # Category model
│   ├── service/
│   │   └── DeviceService.php           # Business logic
│   └── validate/
│       ├── DeviceValidate.php          # Device validation rules
│       └── DeviceCategoryValidate.php  # Category validation rules
├── database/
│   └── migrations/
│       ├── 2024_03_19_000004_create_device_categories_table.php
│       └── 2024_03_19_000005_create_devices_table.php
└── route/
    └── api.php                          # Route definitions
```

---

## Dependencies

- Phase 1 completed (auth, permissions, User, Department models)
- Existing unified Result response class
- Existing JWT middleware
- Existing permission check middleware

---

## Testing Requirements

- Unit tests for models (relationships)
- Validation tests (rules, error messages)
- Service layer tests (CRUD operations)
- API endpoint tests (authentication, authorization, responses)

# 🔌 Nightscout API Backend - API Documentation

This document provides comprehensive documentation for the Nightscout-compatible API endpoints.

## 🔐 Authentication

The API supports multiple authentication methods for maximum compatibility:

### 1. API Secret Header
```bash
curl -H "api-secret: your_api_secret_here" \
     https://your-domain.com/api/v1/entries
```

### 2. JWT Bearer Token
```bash
curl -H "Authorization: Bearer your_jwt_token" \
     https://your-domain.com/api/v1/entries
```

### 3. Token Query Parameter
```bash
curl "https://your-domain.com/api/v1/entries?token=your_api_secret_or_jwt"
```

### 4. URL-based Authentication (for app compatibility)
```
https://api_secret@your-domain.com/api/v1/entries
```

## 👤 User Management Endpoints

### Register User
**POST** `/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "api_secret": "generated_secret",
    "nightscout_url": "https://your-domain.com/api/v1"
  },
  "token": "jwt_token"
}
```

### Login User
**POST** `/auth/login`

Authenticate user and get JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "nightscout_url": "https://your-domain.com/api/v1"
  },
  "token": "jwt_token"
}
```

### Get User Profile
**GET** `/auth/me`

Get current user profile information.

**Headers:** `Authorization: Bearer jwt_token`

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "settings": {
      "units": "mg/dl",
      "timeFormat": 12,
      "theme": "default"
    }
  },
  "nightscout_url": "https://your-domain.com/api/v1"
}
```

### Regenerate API Secret
**POST** `/auth/regenerate-secret`

Generate a new API secret for the user.

**Headers:** `Authorization: Bearer jwt_token`

**Response:**
```json
{
  "message": "API secret regenerated successfully",
  "api_secret": "new_generated_secret",
  "nightscout_url": "https://your-domain.com/api/v1"
}
```

## 📊 CGM Data Endpoints (Nightscout Compatible)

### Get Entries
**GET** `/api/v1/entries[.json]`

Retrieve CGM glucose entries.

**Query Parameters:**
- `count` (number): Number of entries to return (default: 10, max: 1000)
- `find[field][operator]` (string): MongoDB-style query filters

**Examples:**
```bash
# Get last 100 entries
GET /api/v1/entries?count=100

# Get entries from specific date
GET /api/v1/entries?find[dateString][$gte]=2024-01-01

# Get entries with specific glucose value
GET /api/v1/entries?find[sgv]=120
```

**Response:**
```json
[
  {
    "_id": "uuid",
    "type": "sgv",
    "dateString": "2024-01-01T12:00:00.000Z",
    "date": 1704110400000,
    "sgv": 120,
    "direction": "Flat",
    "noise": 1,
    "filtered": 120000,
    "unfiltered": 120000,
    "rssi": 100
  }
]
```

### Upload Entries
**POST** `/api/v1/entries[.json]`

Upload new CGM entries.

**Request Body:**
```json
[
  {
    "type": "sgv",
    "dateString": "2024-01-01T12:00:00.000Z",
    "sgv": 120,
    "direction": "Flat",
    "noise": 1,
    "filtered": 120000,
    "unfiltered": 120000,
    "rssi": 100
  }
]
```

**Response:**
```json
[]
```
*Empty array indicates success. Rejected entries are returned with error details.*

### Get Entries by Type/ID
**GET** `/api/v1/entries/{spec}[.json]`

Get entries filtered by type or specific entry by ID.

**Parameters:**
- `spec`: Entry type (`sgv`, `mbg`, `cal`) or specific entry UUID

**Examples:**
```bash
# Get only SGV entries
GET /api/v1/entries/sgv

# Get specific entry
GET /api/v1/entries/uuid-here
```

## 💊 Treatment Endpoints

### Get Treatments
**GET** `/api/v1/treatments[.json]`

Retrieve treatment records (insulin, carbs, etc.).

**Query Parameters:**
- `count` (number): Number of treatments to return (default: 10, max: 1000)
- `find[field][operator]` (string): MongoDB-style query filters

**Examples:**
```bash
# Get last 50 treatments
GET /api/v1/treatments?count=50

# Get insulin treatments
GET /api/v1/treatments?find[insulin][$gte]=1

# Get carb corrections
GET /api/v1/treatments?find[eventType]=Carb+Correction
```

**Response:**
```json
[
  {
    "_id": "uuid",
    "eventType": "Meal Bolus",
    "created_at": "2024-01-01T12:00:00.000Z",
    "glucose": 120,
    "glucoseType": "Sensor",
    "carbs": 45,
    "insulin": 3.5,
    "units": "mg/dl",
    "notes": "Lunch",
    "enteredBy": "User"
  }
]
```

### Upload Treatments
**POST** `/api/v1/treatments[.json]`

Upload new treatment records.

**Request Body:**
```json
[
  {
    "eventType": "Meal Bolus",
    "created_at": "2024-01-01T12:00:00.000Z",
    "glucose": 120,
    "glucoseType": "Sensor",
    "carbs": 45,
    "insulin": 3.5,
    "units": "mg/dl",
    "notes": "Lunch"
  }
]
```

**Response:**
```json
[]
```

### Delete Treatment
**DELETE** `/api/v1/treatments/{id}`

Delete a specific treatment by ID.

**Response:**
```json
{
  "n": 1,
  "ok": 1,
  "message": "Treatment deleted successfully"
}
```

## ⚙️ System Endpoints

### Server Status
**GET** `/api/v1/status[.json]`

Get server status and configuration.

**Response:**
```json
{
  "apiEnabled": true,
  "careportalEnabled": true,
  "head": "commit-hash",
  "name": "nightscout-api-backend",
  "version": "1.0.0",
  "settings": {
    "units": "mg/dl",
    "timeFormat": 12,
    "customTitle": "Nightscout API Backend",
    "theme": "default",
    "alarmHigh": 180,
    "alarmLow": 70,
    "thresholds": {
      "bg_high": 180,
      "bg_target_top": 150,
      "bg_target_bottom": 80,
      "bg_low": 70
    }
  }
}
```

### Treatment Profile
**GET** `/api/v1/profile[.json]`

Get treatment profile settings.

**Response:**
```json
{
  "dia": 3,
  "carbratio": [{"time": "00:00", "value": 15}],
  "carbs_hr": 20,
  "sens": [{"time": "00:00", "value": 50}],
  "basal": [{"time": "00:00", "value": 1.0}],
  "target_low": [{"time": "00:00", "value": 80}],
  "target_high": [{"time": "00:00", "value": 150}],
  "timezone": "UTC",
  "units": "mg/dl"
}
```


```

## 🔍 Query Syntax

The API supports MongoDB-style query syntax for filtering data:

### Operators
- `$gte`: Greater than or equal
- `$gt`: Greater than
- `$lte`: Less than or equal
- `$lt`: Less than
- `$ne`: Not equal
- `$in`: In array
- `$nin`: Not in array

### Examples
```bash
# Entries from last week
find[dateString][$gte]=2024-01-01&find[dateString][$lte]=2024-01-07

# High glucose readings
find[sgv][$gte]=180

# Specific treatment types
find[eventType]=Meal+Bolus

# Multiple conditions
find[sgv][$gte]=70&find[sgv][$lte]=180&find[type]=sgv
```

## 📱 App Integration Examples

### xDrip+ Configuration
```
Base URL: https://your-domain.com/api/v1
API Secret: your_generated_api_secret
```

### Loop Configuration
```
Site URL: https://your-domain.com
API Secret: your_generated_api_secret
```

### Nightguard Configuration
```
URL: https://your-domain.com
API Secret: your_generated_api_secret
```

## ⚠️ Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

### Common HTTP Status Codes
- `200`: Success
- `400`: Bad Request (validation error)
- `401`: Unauthorized (invalid/missing authentication)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `429`: Too Many Requests (rate limited)
- `500`: Internal Server Error

## 🔒 Security Notes

- All API secrets are hashed using SHA-256 before storage
- JWT tokens expire after 7 days by default
- Rate limiting is applied to prevent abuse
- CORS is configurable for cross-origin requests
- All sensitive data is properly sanitized

# 🔧 Troubleshooting Guide

## API Authentication Issues

### Problem: "Unauthorized" errors when using API secret

If you're getting 401 Unauthorized errors when trying to access the API with an API secret, follow these steps:

#### Step 1: Check your current API secret

Run this command to see your current API secret:

```bash
# Using SQLite (development)
sqlite3 database.sqlite "SELECT email, api_secret FROM users WHERE is_active = 1;"

# Using PostgreSQL (production)
psql -d nightscout_api -c "SELECT email, api_secret FROM users WHERE is_active = true;"
```

#### Step 2: Test your API secret

Use the utility script to test if your API secret works:

```bash
node src/scripts/api-secret-utils.js test YOUR_API_SECRET_HERE
```

#### Step 3: List all users and their secrets

```bash
node src/scripts/api-secret-utils.js list
```

#### Step 4: Test API authentication manually

```bash
# Replace YOUR_API_SECRET with the actual secret from Step 1
curl -H "api-secret: YOUR_API_SECRET" http://localhost:3000/api/v1/entries
```

If this returns `[]` (empty array), authentication is working.
If this returns `{"error":"Unauthorized","message":"Valid API secret or token required"}`, the secret is wrong.

#### Step 5: Regenerate API secret if needed

If your current API secret doesn't work, regenerate it:

```bash
node src/scripts/api-secret-utils.js regenerate your-email@example.com
```

### Common Issues and Solutions

#### Issue 1: Wrong API secret in client app

**Symptoms:** 
- Logs show "User found by API secret: No"
- Client receives 401 Unauthorized

**Solution:**
1. Get the correct API secret from the database (Step 1 above)
2. Update your client app (xDrip+, Loop, etc.) with the correct secret
3. Make sure there are no extra spaces or characters

#### Issue 2: API secret not generated during user creation

**Symptoms:**
- User exists but api_secret field is NULL
- Authentication always fails

**Solution:**
```bash
# Regenerate API secret for the user
node src/scripts/api-secret-utils.js regenerate your-email@example.com
```

#### Issue 3: Hash mismatch in database

**Symptoms:**
- API secret exists but authentication fails
- Hash doesn't match when computed manually

**Solution:**
```bash
# This will regenerate both the secret and hash
node src/scripts/api-secret-utils.js regenerate your-email@example.com
```

### Client App Configuration

#### xDrip+ Configuration
1. Go to Settings → Cloud Upload → Nightscout Sync (REST-API)
2. Set Base URL: `http://your-server:3000/api/v1`
3. Set API Secret: Use the secret from Step 1 above
4. Enable "Use REST API Upload"

#### Loop Configuration
1. Open Loop app
2. Go to Settings → Services → Nightscout
3. Set Site URL: `http://your-server:3000`
4. Set API Secret: Use the secret from Step 1 above

#### Nightguard Configuration
1. Open Nightguard app
2. Go to Settings → Nightscout
3. Set URL: `http://your-server:3000`
4. Set API Secret: Use the secret from Step 1 above

### Debugging Authentication

#### Enable detailed logging

The authentication middleware already includes detailed logging. Check your server logs for:

```
Authentication attempt for: GET /api/v1/entries
API Secret header: Present (8309d05c...)
User found by API secret: Yes (ID: 9177c5fd-f6ee-4d12-8ac6-23e7b56f5cab)
```

#### Test different authentication methods

The API supports multiple authentication methods:

1. **API Secret Header** (recommended):
```bash
curl -H "api-secret: YOUR_SECRET" http://localhost:3000/api/v1/entries
```

2. **Query Parameter**:
```bash
curl "http://localhost:3000/api/v1/entries?token=YOUR_SECRET"
```

3. **JWT Bearer Token**:
```bash
# First get a JWT token
TOKEN=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}' | \
  jq -r '.token')

# Then use it
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/entries
```

### Database Issues

#### Check database connection

```bash
# For SQLite
sqlite3 database.sqlite ".tables"

# For PostgreSQL
psql -d nightscout_api -c "\dt"
```

#### Reset database (development only)

```bash
# This will delete all data!
npm run reset-db
npm run dev
```

### Network Issues

#### Check if server is running

```bash
curl -I http://localhost:3000/api/v1/status
```

Should return `200 OK`.

#### Check firewall/port access

```bash
# Check if port 3000 is open
netstat -tlnp | grep :3000
# or
ss -tlnp | grep :3000
```

### Getting Help

If you're still having issues:

1. Check the server logs for detailed error messages
2. Run the API secret utility: `node src/scripts/api-secret-utils.js list`
3. Test authentication manually with curl
4. Check that your client app is using the correct URL and API secret

### Quick Fix Commands

```bash
# Get your API secret
sqlite3 database.sqlite "SELECT email, api_secret FROM users WHERE is_active = 1;"

# Test it works
curl -H "api-secret: YOUR_SECRET_HERE" http://localhost:3000/api/v1/entries

# If it doesn't work, regenerate it
node src/scripts/api-secret-utils.js regenerate your-email@example.com
```

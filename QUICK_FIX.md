# VPS Deployment Quick Fix

## Problem: "Authentication failed against database server" error

This happens when the PostgreSQL container was created with different credentials than your `.env` file.

## Quick Fix (Run this on your VPS):

```bash
# 1. Stop everything and remove volumes
docker compose down -v

# 2. Verify your .env file passwords match
# Edit .env and make sure these match:
nano .env

# Check these two lines use the SAME password:
POSTGRES_PASSWORD=your_password_here
DATABASE_URL=postgresql://postgres:your_password_here@postgres:5432/defence_sentinel

# 3. Restart with fresh database
docker compose up -d --build

# 4. Wait 20 seconds for database to initialize
sleep 20

# 5. Verify it works
docker compose exec backend npx prisma db push

# 6. Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

## Expected .env for VPS (151.80.145.44):

```bash
# Database credentials - MUST MATCH!
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=defence_sentinel

# Database URL - password must match POSTGRES_PASSWORD above
DATABASE_URL=postgresql://postgres:your_secure_password@postgres:5432/defence_sentinel

# CORS - your VPS IP
CORS_ORIGIN=http://151.80.145.44:5174

# Frontend URLs
VITE_API_URL=http://151.80.145.44:3001/api
VITE_IOT_SIMULATOR_URL=http://151.80.145.44:4000

# Security
JWT_SECRET=change_this_to_random_string_min_32_chars

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
```

## Automated Deployment Script:

```bash
# Use the deployment script for fresh install
./scripts/deploy-vps.sh
```

## Diagnostic Script:

```bash
# Check what's wrong
./scripts/diagnose.sh
```

## Important Notes:

⚠️ **`docker compose down -v`** deletes ALL data (database, redis, etc.)  
✅ Only use when doing fresh deployment  
✅ Back up data first if you have important information  
✅ Password in `POSTGRES_PASSWORD` and `DATABASE_URL` must be identical  
✅ After changing .env, always restart: `docker compose down && docker compose up -d`

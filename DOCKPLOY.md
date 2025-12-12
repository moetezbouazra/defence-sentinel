# Dockploy Deployment Guide

## Environment Variables to Set in Dockploy

Copy these into Dockploy's environment variables section:

```bash
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=defence_sentinel
DATABASE_URL=postgresql://postgres:your_secure_password_here@postgres:5432/defence_sentinel

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379

# MQTT
MQTT_URL=mqtt://mosquitto:1883

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# Backend
PORT=3001
NODE_ENV=production
JWT_SECRET=change_this_to_very_long_random_string_min_32_chars

# CORS - IMPORTANT: Set to your VPS IP or domain
CORS_ORIGIN=http://151.80.145.44:5174

# Frontend - Set to your VPS IP or domain
VITE_API_URL=http://151.80.145.44:3001/api
VITE_IOT_SIMULATOR_URL=http://151.80.145.44:4000

# Email (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587

# Optional
N8N_WEBHOOK_URL=http://n8n:5678/webhook
```

## Important Notes

⚠️ **Critical**: Make sure the password in `POSTGRES_PASSWORD` matches the password in `DATABASE_URL`

⚠️ **CORS_ORIGIN**: Must match your frontend URL exactly (where you access the app from browser)

⚠️ **VITE_API_URL**: Must be accessible from the browser (use your VPS public IP or domain)

## After Setting Environment Variables in Dockploy:

1. Deploy/Redeploy the application
2. Wait for all containers to start (check Dockploy logs)
3. Test registration at: `http://151.80.145.44:5174`

## If You Get Database Authentication Error:

The database was already created with old credentials. In Dockploy:
1. Stop the application
2. Remove the `postgres_data` volume
3. Redeploy

## Testing:

```bash
# Health check
curl http://151.80.145.44:3001/health

# Test registration
curl -X POST http://151.80.145.44:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

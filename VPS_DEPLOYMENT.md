# VPS Deployment Guide for Defence Sentinel

## Quick Start (Recommended)

### Automated Deployment

```bash
# 1. Copy environment template
cp .env.vps.example .env

# 2. Edit with your VPS details
nano .env
# Update: CORS_ORIGIN, VITE_API_URL, POSTGRES_PASSWORD, JWT_SECRET, EMAIL credentials

# 3. Run deployment script
./scripts/deploy-vps.sh
```

### Manual Deployment

If you prefer manual steps, follow the detailed guide below.

## Detailed Setup

### 1. Update Environment Variables

Edit your `.env` file on the VPS:

```bash
nano .env
```

Update these critical variables:

```bash
# Replace YOUR_VPS_IP with your actual VPS IP address or domain
CORS_ORIGIN=http://YOUR_VPS_IP:5174

# If using a domain with SSL:
# CORS_ORIGIN=https://yourdomain.com

# For multiple origins (comma-separated):
# CORS_ORIGIN=http://YOUR_VPS_IP:5174,https://yourdomain.com

# Frontend API URLs
VITE_API_URL=http://YOUR_VPS_IP:3001/api
VITE_IOT_SIMULATOR_URL=http://YOUR_VPS_IP:4000

# Change default passwords
POSTGRES_PASSWORD=secure_password_here
JWT_SECRET=very_secure_random_string_here
```

### 2. Rebuild and Restart Containers

```bash
# Stop all containers
docker compose down

# Rebuild with updated environment
docker compose up -d --build

# Check logs
docker compose logs -f backend frontend
```

### 3. Verify CORS Configuration

Test from browser console on your frontend:

```javascript
fetch('http://YOUR_VPS_IP:3001/api/health')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

## Common Issues

### Issue: Database authentication error during registration

**Error Message:**
```
Authentication failed against database server at `postgres`, 
the provided database credentials for `postgres` are not valid.
```

**Root Cause**: The PostgreSQL container was created with different credentials than what's in your current `.env` file.

**Solution**: Reset the database with correct credentials

```bash
# IMPORTANT: This will delete all data!
# Backup first if you have important data

# 1. Stop and remove all containers and volumes
docker compose down -v

# 2. Verify .env has consistent credentials
cat .env | grep -E "POSTGRES_PASSWORD|DATABASE_URL"
# Both should use the same password!

# 3. Start fresh
docker compose up -d --build

# 4. Wait for database to be healthy (about 20 seconds)
docker compose ps

# 5. Verify database connection
docker compose exec backend npx prisma db push
```

**Prevention**: Always ensure `POSTGRES_PASSWORD` matches the password in `DATABASE_URL`:
```bash
# These MUST match:
POSTGRES_PASSWORD=mypassword123
DATABASE_URL=postgresql://postgres:mypassword123@postgres:5432/defence_sentinel
```

### Issue: Still getting CORS errors

**Solution 1**: Verify CORS_ORIGIN matches your frontend URL exactly
```bash
# Check backend logs
docker compose logs backend | grep CORS

# Restart backend
docker compose restart backend
```

**Solution 2**: If using HTTPS, make sure CORS_ORIGIN uses https://
```bash
CORS_ORIGIN=https://yourdomain.com
```

### Issue: WebSocket connection fails

**Solution**: Add your domain/IP to Socket.IO cors origins
- Already configured in `backend/src/index.ts` to use same CORS_ORIGIN

### Issue: Mixed content errors (HTTP/HTTPS)

**Solution**: Use HTTPS for all services or HTTP for all
- If frontend is HTTPS, backend must be HTTPS too
- Consider using nginx reverse proxy with SSL

## Production Security Checklist

- [ ] Change `POSTGRES_PASSWORD` to a strong password
- [ ] Change `JWT_SECRET` to a random secure string (min 32 characters)
- [ ] Update `EMAIL_USER` and `EMAIL_PASSWORD` with your credentials
- [ ] Set `CORS_ORIGIN` to your specific domain (not `*`)
- [ ] Consider using environment-specific `.env` files
- [ ] Set up SSL/TLS certificates (use Let's Encrypt)
- [ ] Configure firewall rules (allow only necessary ports)
- [ ] Set up Docker volume backups for postgres_data

## Using with Nginx Reverse Proxy

Example nginx configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5174;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers (if needed)
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Accept,Authorization,Cache-Control,Content-Type,DNT,If-Modified-Since,Keep-Alive,Origin,User-Agent,X-Requested-With' always;
    }

    # WebSocket (Socket.IO)
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Then update `.env`:
```bash
CORS_ORIGIN=http://yourdomain.com
VITE_API_URL=http://yourdomain.com/api
```

## Monitoring

Check service health:
```bash
# All services status
docker compose ps

# Backend logs
docker compose logs -f backend

# Frontend logs  
docker compose logs -f frontend

# All logs
docker compose logs -f
```

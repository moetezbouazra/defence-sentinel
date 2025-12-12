#!/bin/bash
# Diagnostic script for Defence Sentinel deployment issues

echo "=== Defence Sentinel Diagnostics ==="
echo ""

echo "1. Checking Docker containers status..."
docker compose ps
echo ""

echo "2. Checking environment variables in backend..."
docker compose exec backend sh -c 'echo "DATABASE_URL: $DATABASE_URL"'
docker compose exec backend sh -c 'echo "CORS_ORIGIN: $CORS_ORIGIN"'
echo ""

echo "3. Testing database connection from backend..."
docker compose exec backend npx prisma db push --skip-generate --force-reset=false 2>&1 | head -5
echo ""

echo "4. Testing direct PostgreSQL connection..."
docker compose exec postgres psql -U postgres -d defence_sentinel -c "SELECT version();" 2>&1 | head -3
echo ""

echo "5. Checking User table..."
docker compose exec postgres psql -U postgres -d defence_sentinel -c "SELECT COUNT(*) as user_count FROM \"User\";" 2>&1
echo ""

echo "6. Recent backend logs..."
docker compose logs backend --tail=10
echo ""

echo "7. Testing API health endpoint..."
curl -s http://localhost:3001/health
echo ""
echo ""

echo "=== Diagnostics Complete ==="

#!/bin/bash
# Fresh deployment script for VPS

set -e  # Exit on error

echo "=== Defence Sentinel VPS Deployment ==="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create .env file from .env.vps.example"
    exit 1
fi

echo "✓ .env file found"
echo ""

# Verify critical environment variables
echo "Checking environment variables..."
source .env

if [ -z "$POSTGRES_PASSWORD" ]; then
    echo "❌ Error: POSTGRES_PASSWORD not set in .env"
    exit 1
fi

if [ -z "$CORS_ORIGIN" ]; then
    echo "❌ Error: CORS_ORIGIN not set in .env"
    exit 1
fi

echo "✓ POSTGRES_PASSWORD: [SET]"
echo "✓ DATABASE_URL: $DATABASE_URL"
echo "✓ CORS_ORIGIN: $CORS_ORIGIN"
echo "✓ VITE_API_URL: $VITE_API_URL"
echo ""

# Check if passwords match in DATABASE_URL
DB_PASS_IN_URL=$(echo $DATABASE_URL | grep -oP '://postgres:\K[^@]+')
if [ "$DB_PASS_IN_URL" != "$POSTGRES_PASSWORD" ]; then
    echo "⚠️  Warning: Password mismatch between POSTGRES_PASSWORD and DATABASE_URL"
    echo "   POSTGRES_PASSWORD: $POSTGRES_PASSWORD"
    echo "   DATABASE_URL password: $DB_PASS_IN_URL"
    echo ""
    read -p "Do you want to continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "Stopping existing containers..."
docker compose down -v

echo ""
echo "Building and starting services..."
docker compose up -d --build

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo ""
echo "Checking services status..."
docker compose ps

echo ""
echo "Testing database connection..."
docker compose exec -T backend npx prisma db push --skip-generate || {
    echo "❌ Database connection failed!"
    echo "Checking backend logs..."
    docker compose logs backend --tail=20
    exit 1
}

echo ""
echo "✅ Deployment successful!"
echo ""
echo "Services available at:"
echo "  Frontend: http://$(hostname -I | awk '{print $1}'):5174"
echo "  Backend API: http://$(hostname -I | awk '{print $1}'):3001/api"
echo "  Health check: http://$(hostname -I | awk '{print $1}'):3001/health"
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"

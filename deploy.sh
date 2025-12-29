#!/bin/bash

# Deployment Script for TeamHub

set -e  # Exit on any error

echo "=========================================="
echo "Starting Deployment Process..."
echo "Date: $(date)"
echo "=========================================="

# 1. Pull latest code
echo ">> Pulling latest changes from git..."
git pull
if [ $? -ne 0 ]; then
    echo "Error: git pull failed"
    exit 1
fi

# 2. Backup database before deploy
echo ">> Backing up database..."
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
if [ -f "./server/database.sqlite" ]; then
    cp "./server/database.sqlite" "$BACKUP_DIR/database_$(date +%Y%m%d_%H%M%S).sqlite"
    echo "   Database backed up to $BACKUP_DIR"
    # Keep only last 5 backups
    ls -t "$BACKUP_DIR"/database_*.sqlite 2>/dev/null | tail -n +6 | xargs -r rm --
fi

# 3. Install Dependencies
echo ">> Installing root dependencies..."
npm install --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "Warning: npm install had issues, continuing..."
fi

echo ">> Installing server dependencies..."
npm install --prefix server --legacy-peer-deps
if [ $? -ne 0 ]; then
    echo "Error: Server npm install failed"
    exit 1
fi

# 4. Build Project
echo ">> Building Frontend..."
npm run build
if [ $? -ne 0 ]; then
    echo "Error: Frontend build failed"
    exit 1
fi

echo ">> Building Backend..."
npm run build --prefix server
if [ $? -ne 0 ]; then
    echo "Error: Backend build failed"
    exit 1
fi

# 5. Run Migrations (if any)
echo ">> Running database migrations..."
cd server && npm run typeorm migration:run -- -d ./dist/data-source.js 2>/dev/null || echo "   No pending migrations or migration skipped"
cd ..

# 6. Restart PM2
echo ">> Restarting PM2 process..."
# Create logs directory if not exists
mkdir -p logs

# Stop and delete existing process if exists
pm2 stop ecosystem.config.cjs 2>/dev/null || true
pm2 delete ecosystem.config.cjs 2>/dev/null || true

# Start with ecosystem config
pm2 start ecosystem.config.cjs
pm2 save

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✅ Deployment Successful!"
    echo "=========================================="
    pm2 status
else
    echo "=========================================="
    echo "❌ PM2 Restart Failed!"
    echo "=========================================="
    exit 1
fi

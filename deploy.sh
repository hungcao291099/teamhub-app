#!/bin/bash

# Deployment Script for TeamHub

echo "=========================================="
echo "Starting Deployment Process..."
echo "=========================================="

# 1. Pull latest code
echo ">> Pulling latest changes from git..."
git pull
if [ $? -ne 0 ]; then
    echo "Error: git pull failed"
    exit 1
fi

# 2. Install Dependencies
echo ">> Installing root dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "Error: npm install failed"
    # exit 1 (Optional: sometimes we might want to continue)
fi

echo ">> Installing server dependencies..."
npm install --prefix server
if [ $? -ne 0 ]; then
    echo "Error: Server npm install failed"
    exit 1
fi

# 3. Build Project
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

# 4. Restart PM2
echo ">> Restarting PM2 process..."
# Try to restart, if fails (process not found), start it
pm2 restart teamhub-server || pm2 start dist/index.js --name "teamhub-server" --cwd ./server

if [ $? -eq 0 ]; then
    echo "=========================================="
    echo "✅ Deployment Successful!"
    echo "=========================================="
else
    echo "=========================================="
    echo "❌ PM2 Restart Failed!"
    echo "=========================================="
    exit 1
fi

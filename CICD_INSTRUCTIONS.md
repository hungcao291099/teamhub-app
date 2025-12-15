# CI/CD Setup Guide (Self-Hosted Runner - No Docker)

**Deployment Method:**
This guide uses **PM2** (Process Manager) and **Nginx** for deployment on Ubuntu without Docker. The GitHub Actions workflow uses a self-hosted runner to deploy directly on your server.

## Prerequisites on Ubuntu Server

### 1. Install Node.js (v20)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 2. Install PM2

```bash
sudo npm install -g pm2

# Setup PM2 to start on boot
pm2 startup
# Run the command that PM2 outputs
```

### 3. Install Nginx

```bash
sudo apt-get update
sudo apt-get install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 4. Create Application Directory

```bash
# Create directory where the app will be deployed
mkdir -p ~/teamhub-app
cd ~/teamhub-app
```

## GitHub Actions Setup

### 1. Add Runner to GitHub

1. Go to your GitHub Repository
2. Settings → **Actions** → **Runners**
3. Click **New self-hosted runner**
4. Select **Linux**
5. Run the commands shown by GitHub on your **Ubuntu Server**

   _Example commands (Use the specific token from GitHub):_

   ```bash
   # Create a folder
   mkdir actions-runner && cd actions-runner

   # Download (GitHub will provide the exact curl link)
   curl -O -L https://github.com/actions/runner/releases/download/v2.x.x/actions-runner-linux-x64-v2.x.x.tar.gz

   # Extract
   tar xzf ./actions-runner-linux-x64-*.tar.gz

   # Configure (Use URL and token from GitHub page)
   ./config.sh --url https://github.com/YOUR_USER/YOUR_REPO --token YOUR_TOKEN

   # Set work directory to your app directory
   # When prompted for work folder, enter: /home/YOUR_USER/teamhub-app
   ```

### 2. Install Runner as Service

```bash
# Install service
sudo ./svc.sh install

# Start service
sudo ./svc.sh start

# Check status
sudo ./svc.sh status
```

### 3. Verify Runner

- Go to Settings → Actions → Runners
- You should see your runner is "Idle" (Green)

## Nginx Configuration

### 1. Update Nginx Config

Make sure your `nginx.conf` file is properly configured for non-Docker deployment:

```nginx
server {
    listen 80;
    server_name localhost;  # Change to your domain

    # Serve static frontend files
    location / {
        root /home/YOUR_USER/teamhub-app/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy WebSocket connections
    location /socket.io {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 2. Apply Nginx Configuration

The GitHub Actions workflow will automatically copy the nginx config, but you can also do it manually:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/teamhub
sudo ln -sf /etc/nginx/sites-available/teamhub /etc/nginx/sites-enabled/teamhub

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Environment Variables

Create a `.env` file in the server directory with your configuration:

```bash
cd ~/teamhub-app/server
nano .env
```

Add your environment variables:

```
NODE_ENV=production
PORT=3001
JWT_SECRET=your-secret-key
DATABASE_PATH=./database.sqlite
```

## Deploy

### Manual First Deployment

```bash
cd ~/teamhub-app
git clone https://github.com/YOUR_USER/YOUR_REPO.git .

# Install dependencies
npm ci
cd server && npm ci && cd ..

# Build
npm run build
cd server && npm run build && cd ..

# Run migrations
cd server && npm run migration:run && cd ..

# Start with PM2
cd server
pm2 start dist/index.js --name teamhub-server
pm2 save
```

### Automatic Deployment via GitHub Actions

After the runner is set up, simply push to the `main` branch:

```bash
git add .
git commit -m "Deploy update"
git push origin main
```

The workflow will:

1. Checkout code
2. Install dependencies
3. Build client and server
4. Run database migrations
5. Deploy with PM2
6. Configure Nginx (if needed)

## PM2 Commands

```bash
# View running processes
pm2 status

# View logs
pm2 logs teamhub-server

# Restart application
pm2 restart teamhub-server

# Stop application
pm2 stop teamhub-server

# Delete application from PM2
pm2 delete teamhub-server

# Monitor in real-time
pm2 monit
```

## Troubleshooting

### Check Application Logs

```bash
pm2 logs teamhub-server --lines 100
```

### Check Nginx Logs

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Restart Services

```bash
# Restart PM2 process
pm2 restart teamhub-server

# Restart Nginx
sudo systemctl restart nginx

# Restart GitHub Actions runner
cd ~/actions-runner
sudo ./svc.sh restart
```

### Port Already in Use

```bash
# Find what's using port 3001
sudo lsof -i :3001

# Kill the process if needed
sudo kill -9 <PID>
```

# TaskFlow Deployment Guide

This guide covers deploying TaskFlow to Railway (recommended) and other platforms.

---

## Prerequisites

- MongoDB database (MongoDB Atlas or Railway MongoDB)
- Railway account (or your preferred hosting platform)
- Git repository (GitHub, GitLab, etc.)

---

## Option 1: Railway Deployment (Recommended)

Railway provides a simple, modern deployment experience with automatic HTTPS, environment variables, and built-in MongoDB.

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Connect your GitHub account and select the TaskFlow repository

### Step 2: Deploy Backend

1. In your Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Railway will auto-detect the backend (Node.js)
4. Click **"Add variables"** and set:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow
   JWT_SECRET=your_super_secret_jwt_key_min_32_chars
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   CLIENT_URL=https://your-frontend-url.railway.app
   PORT=5000
   ```
5. Set **Root Directory** to `backend`
6. Deploy! Railway will run `npm install` and `npm start`

### Step 3: Add MongoDB (if not using Atlas)

1. In your Railway project, click **"+ New"** → **"Database"** → **"Add MongoDB"**
2. Railway will provision a MongoDB instance and add `MONGODB_URI` automatically
3. Update your backend service to use the Railway MongoDB connection string

### Step 4: Deploy Frontend

1. In the same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. Set **Root Directory** to `frontend`
4. Click **"Add variables"** and set:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
5. Set **Build Command**: `npm run build`
6. Set **Start Command**: `npx serve dist -s -l 3000`
7. Deploy!

### Step 5: Update CORS

1. Go back to your backend service settings
2. Update `CLIENT_URL` to your frontend Railway URL
3. Redeploy the backend

### Step 6: Seed Demo Data (Optional)

1. In Railway backend service, open the **"Terminal"** tab
2. Run: `npm run seed`
3. This creates demo users, projects, and tasks

---

## Option 2: Vercel (Frontend) + Railway (Backend)

### Backend on Railway

Follow **Step 2** and **Step 3** from Option 1 above.

### Frontend on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"** → **"Import Git Repository"**
3. Select your TaskFlow repository
4. Set **Root Directory** to `frontend`
5. Set **Framework Preset** to `Vite`
6. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.railway.app/api
   ```
7. Deploy!

---

## Option 3: Manual VPS Deployment (Ubuntu/Debian)

### Prerequisites

- Ubuntu 20.04+ or Debian 11+ server
- Domain name (optional but recommended)
- SSH access

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 2: Clone and Setup Backend

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/your-username/taskflow.git
cd taskflow/backend

# Install dependencies
sudo npm install --production

# Create .env file
sudo nano .env
```

Add:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/taskflow
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
NODE_ENV=production
CLIENT_URL=https://yourdomain.com
```

```bash
# Start with PM2
sudo pm2 start src/server.js --name taskflow-api
sudo pm2 save
sudo pm2 startup
```

### Step 3: Build and Setup Frontend

```bash
cd /var/www/taskflow/frontend

# Create .env file
sudo nano .env
```

Add:
```
VITE_API_URL=https://yourdomain.com/api
```

```bash
# Install and build
sudo npm install
sudo npm run build

# Move build to Nginx directory
sudo mkdir -p /var/www/taskflow-frontend
sudo cp -r dist/* /var/www/taskflow-frontend/
```

### Step 4: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/taskflow
```

Add:
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend
    location / {
        root /var/www/taskflow-frontend;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Uploads
    location /uploads {
        proxy_pass http://localhost:5000;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: Setup SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Step 6: Seed Demo Data (Optional)

```bash
cd /var/www/taskflow/backend
npm run seed
```

---

## Option 4: Docker Deployment

### Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    container_name: taskflow-mongo
    restart: always
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_DATABASE: taskflow

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: taskflow-backend
    restart: always
    ports:
      - "5000:5000"
    environment:
      PORT: 5000
      MONGODB_URI: mongodb://mongodb:27017/taskflow
      JWT_SECRET: your_super_secret_jwt_key_min_32_chars
      JWT_EXPIRES_IN: 7d
      NODE_ENV: production
      CLIENT_URL: http://localhost:3000
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: taskflow-frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      VITE_API_URL: http://localhost:5000/api
    depends_on:
      - backend

volumes:
  mongo-data:
```

### Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Deploy:

```bash
docker-compose up -d
```

---

## Environment Variables Reference

### Backend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | No | Server port | `5000` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://localhost:27017/taskflow` |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) | `your_super_secret_key_here` |
| `JWT_EXPIRES_IN` | No | Token expiry | `7d` |
| `NODE_ENV` | No | Environment | `production` |
| `CLIENT_URL` | Yes | Frontend URL for CORS | `https://taskflow.com` |

### Frontend

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://api.taskflow.com/api` or `/api` |

---

## Post-Deployment Checklist

- [ ] Backend is running and accessible
- [ ] Frontend is running and accessible
- [ ] MongoDB is connected
- [ ] CORS is configured correctly
- [ ] Environment variables are set
- [ ] SSL/HTTPS is enabled (production)
- [ ] Demo data seeded (optional)
- [ ] Test login with demo credentials
- [ ] Test creating a project
- [ ] Test creating a task
- [ ] Test Kanban drag-and-drop
- [ ] Test notifications
- [ ] Test dark mode toggle

---

## Troubleshooting

### Backend won't start

- Check MongoDB connection string
- Verify `JWT_SECRET` is set
- Check logs: `pm2 logs taskflow-api` (PM2) or Railway logs

### Frontend shows API errors

- Verify `VITE_API_URL` is correct
- Check CORS settings in backend
- Ensure backend is running

### MongoDB connection failed

- Check MongoDB is running: `sudo systemctl status mongod`
- Verify connection string format
- Check firewall rules

### CORS errors

- Update `CLIENT_URL` in backend `.env`
- Restart backend after changing CORS settings

---

## Monitoring & Maintenance

### PM2 Commands (VPS)

```bash
pm2 status              # Check status
pm2 logs taskflow-api   # View logs
pm2 restart taskflow-api # Restart
pm2 stop taskflow-api   # Stop
pm2 delete taskflow-api # Remove
```

### Railway

- View logs in Railway dashboard
- Monitor resource usage
- Set up alerts for downtime

### Backup MongoDB

```bash
# Local backup
mongodump --db taskflow --out /backup/taskflow-$(date +%Y%m%d)

# Restore
mongorestore --db taskflow /backup/taskflow-20240101/taskflow
```

---

## Scaling Considerations

- Use MongoDB Atlas for managed database
- Enable Redis for session caching
- Add load balancer for multiple backend instances
- Use CDN for static assets
- Enable database indexing (already configured)
- Monitor with tools like New Relic or Datadog

---

## Support

For issues or questions:
- Check the [README.md](README.md)
- Open an issue on GitHub
- Review Railway/Vercel documentation

# Deploy TaskFlow to Vercel

This guide covers deploying TaskFlow with the **frontend on Vercel** and **backend on Railway**.

---

## Architecture

- **Frontend** → Vercel (static hosting with serverless functions)
- **Backend** → Railway (Node.js hosting)
- **Database** → MongoDB Atlas (free cloud database)

---

## Step 1: Setup MongoDB Atlas (5 minutes)

1. Go to **[mongodb.com/atlas](https://www.mongodb.com/atlas)** and sign up
2. Create a **free M0 cluster**:
   - Cloud Provider: AWS
   - Region: Choose closest to you
   - Cluster Name: `taskflow-cluster`
3. **Database Access** → Add Database User:
   - Username: `taskflow`
   - Password: Generate a secure password (save it!)
4. **Network Access** → Add IP Address:
   - Click "Allow Access from Anywhere"
   - IP: `0.0.0.0/0`
5. Click **Connect** → **Drivers** → Copy connection string:
   ```
   mongodb+srv://taskflow:<password>@cluster0.xxxxx.mongodb.net/taskflow?retryWrites=true&w=majority
   ```
   Replace `<password>` with your actual password

---

## Step 2: Deploy Backend to Railway (10 minutes)

### 2.1 Create Railway Account

1. Go to **[railway.app](https://railway.app)**
2. Sign up with GitHub

### 2.2 Deploy Backend

1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Connect your GitHub account
3. Select your TaskFlow repository
4. Railway will detect the project

### 2.3 Configure Backend Service

1. Click on the detected service
2. Go to **Settings**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Go to **Variables** tab and add:
   ```
   MONGODB_URI=mongodb+srv://taskflow:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taskflow
   JWT_SECRET=your_super_secret_jwt_key_min_32_characters_long
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   CLIENT_URL=https://your-app.vercel.app
   PORT=5000
   ```
   ⚠️ Replace:
   - `YOUR_PASSWORD` with your MongoDB password
   - `your-app.vercel.app` with your Vercel domain (we'll get this in Step 3)

4. Click **Deploy**
5. Once deployed, copy your Railway backend URL (e.g., `https://taskflow-backend-production.up.railway.app`)

### 2.4 Seed Demo Data (Optional)

1. In Railway dashboard, click your backend service
2. Go to **"Terminal"** tab (or use Railway CLI)
3. Run:
   ```bash
   npm run seed
   ```
4. You should see: "✅ Seed data created successfully!"

---

## Step 3: Deploy Frontend to Vercel (5 minutes)

### 3.1 Create Vercel Account

1. Go to **[vercel.com](https://vercel.com)**
2. Sign up with GitHub

### 3.2 Import Project

1. Click **"Add New..."** → **"Project"**
2. Import your TaskFlow repository
3. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### 3.3 Add Environment Variables

Click **"Environment Variables"** and add:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://your-railway-backend.up.railway.app/api` |

⚠️ Replace with your actual Railway backend URL from Step 2.4

### 3.4 Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://taskflow-abc123.vercel.app`

---

## Step 4: Update Backend CORS

Now that you have your Vercel URL, update the backend:

1. Go back to **Railway dashboard**
2. Click your backend service → **Variables**
3. Update `CLIENT_URL`:
   ```
   CLIENT_URL=https://taskflow-abc123.vercel.app
   ```
4. Save — Railway will auto-redeploy

---

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://taskflow-abc123.vercel.app`
2. You should see the TaskFlow login page
3. Login with:
   - Email: `admin@taskflow.com`
   - Password: `password123`
4. Test features:
   - ✅ Dashboard loads
   - ✅ Create a project
   - ✅ Create a task
   - ✅ Drag tasks on Kanban board
   - ✅ Dark mode toggle

---

## Vercel Configuration Files

Create these files in your `frontend/` directory for optimal Vercel deployment:

### `frontend/vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## Custom Domain (Optional)

### On Vercel:

1. Go to your project → **Settings** → **Domains**
2. Add your custom domain (e.g., `taskflow.yourdomain.com`)
3. Follow DNS instructions to add CNAME record
4. Wait for DNS propagation (5-30 minutes)

### Update Backend:

1. Go to Railway → Backend service → **Variables**
2. Update `CLIENT_URL` to your custom domain:
   ```
   CLIENT_URL=https://taskflow.yourdomain.com
   ```

---

## Environment Variables Summary

### Backend (Railway)

| Variable | Example | Required |
|----------|---------|----------|
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/taskflow` | ✅ Yes |
| `JWT_SECRET` | `your_super_secret_key_min_32_chars` | ✅ Yes |
| `JWT_EXPIRES_IN` | `7d` | No (default: 7d) |
| `NODE_ENV` | `production` | ✅ Yes |
| `CLIENT_URL` | `https://taskflow.vercel.app` | ✅ Yes |
| `PORT` | `5000` | No (Railway auto-assigns) |

### Frontend (Vercel)

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_API_URL` | `https://backend.railway.app/api` | ✅ Yes |

---

## Troubleshooting

### Frontend shows "Network Error"

**Problem**: Frontend can't reach backend

**Solutions**:
1. Check `VITE_API_URL` in Vercel environment variables
2. Verify Railway backend is running (check logs)
3. Test backend directly: `https://your-backend.railway.app/health`
4. Check CORS: Ensure `CLIENT_URL` in Railway matches your Vercel URL

### "MongoDB connection failed"

**Problem**: Backend can't connect to MongoDB Atlas

**Solutions**:
1. Check `MONGODB_URI` is correct in Railway variables
2. Verify MongoDB Atlas Network Access allows `0.0.0.0/0`
3. Check MongoDB Atlas user has correct password
4. Test connection string format:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/taskflow
   ```

### "Invalid token" or "Token expired"

**Problem**: JWT authentication issues

**Solutions**:
1. Clear browser localStorage
2. Verify `JWT_SECRET` is set in Railway
3. Check `JWT_SECRET` is at least 32 characters
4. Try logging in again

### Vercel build fails

**Problem**: Build errors during deployment

**Solutions**:
1. Check build logs in Vercel dashboard
2. Verify `Root Directory` is set to `frontend`
3. Ensure `package.json` has correct scripts
4. Try building locally: `npm run build`

### Railway backend crashes

**Problem**: Backend service keeps restarting

**Solutions**:
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Check MongoDB connection string
4. Ensure `NODE_ENV=production`

---

## Updating Your Deployment

### Update Frontend:

1. Push changes to GitHub
2. Vercel auto-deploys on every push to `main` branch
3. Or manually redeploy in Vercel dashboard

### Update Backend:

1. Push changes to GitHub
2. Railway auto-deploys on every push to `main` branch
3. Or manually redeploy in Railway dashboard

### Update Environment Variables:

**Vercel**:
1. Project → Settings → Environment Variables
2. Edit variable → Save
3. Redeploy (Deployments → ⋯ → Redeploy)

**Railway**:
1. Service → Variables
2. Edit variable → Save
3. Auto-redeploys

---

## Cost Breakdown

| Service | Free Tier | Paid Plans |
|---------|-----------|------------|
| **Vercel** | 100 GB bandwidth/month, Unlimited deployments | $20/month (Pro) |
| **Railway** | $5 free credit/month (~500 hours) | $5/month + usage |
| **MongoDB Atlas** | 512 MB storage (M0 cluster) | $9/month (M10) |

**Total Free Tier**: Suitable for development and small projects

---

## Production Checklist

Before going live:

- [ ] MongoDB Atlas cluster created and accessible
- [ ] Railway backend deployed and running
- [ ] Vercel frontend deployed and accessible
- [ ] Environment variables set correctly
- [ ] CORS configured (CLIENT_URL matches Vercel URL)
- [ ] Demo data seeded (optional)
- [ ] Test login with demo credentials
- [ ] Test creating projects and tasks
- [ ] Test Kanban drag-and-drop
- [ ] Test on mobile devices
- [ ] Custom domain configured (optional)
- [ ] SSL/HTTPS enabled (automatic on Vercel/Railway)
- [ ] Error monitoring setup (optional: Sentry)

---

## Alternative: Deploy Backend to Vercel Serverless

If you want to deploy the backend to Vercel as serverless functions:

### Create `backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "JWT_SECRET": "@jwt_secret",
    "NODE_ENV": "production"
  }
}
```

**Note**: Serverless has limitations:
- 10-second timeout per request
- No persistent connections
- Cold starts
- Not ideal for WebSockets or long-running tasks

**Recommendation**: Use Railway for backend (better for Node.js APIs)

---

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Railway Docs**: [docs.railway.app](https://docs.railway.app)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

## Quick Deploy Commands

```bash
# Install Vercel CLI (optional)
npm install -g vercel

# Deploy frontend from terminal
cd frontend
vercel

# Install Railway CLI (optional)
npm install -g @railway/cli

# Deploy backend from terminal
cd backend
railway login
railway up
```

---

**You're all set!** 🚀

Your TaskFlow app is now live on Vercel with a production-ready backend on Railway and MongoDB Atlas.

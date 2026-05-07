# TaskFlow — Quick Deploy to Vercel (5 Minutes)

Follow these exact steps to deploy TaskFlow to production.

---

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Railway account (sign up at [railway.app](https://railway.app))
- MongoDB Atlas account (sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas))

---

## Step 1: Push to GitHub (2 min)

If you haven't already:

```bash
cd taskflow
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

---

## Step 2: MongoDB Atlas (2 min)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Sign up
2. Create free cluster (M0) → AWS → Closest region
3. **Database Access** → Add user: `taskflow` / generate password (save it!)
4. **Network Access** → Add IP: `0.0.0.0/0` (allow all)
5. **Connect** → Drivers → Copy connection string:
   ```
   mongodb+srv://taskflow:PASSWORD@cluster0.xxxxx.mongodb.net/taskflow
   ```

---

## Step 3: Deploy Backend to Railway (3 min)

1. Go to [railway.app](https://railway.app) → Sign in with GitHub
2. **New Project** → **Deploy from GitHub repo** → Select `taskflow`
3. Railway detects the project → Click the service
4. **Settings**:
   - Root Directory: `backend`
   - Start Command: `npm start`
5. **Variables** → Add:
   ```
   MONGODB_URI=mongodb+srv://taskflow:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/taskflow
   JWT_SECRET=taskflow_production_secret_key_2024_min_32_chars
   JWT_EXPIRES_IN=7d
   NODE_ENV=production
   CLIENT_URL=https://taskflow.vercel.app
   ```
6. **Deploy** → Copy your Railway URL (e.g., `taskflow-production.up.railway.app`)

---

## Step 4: Deploy Frontend to Vercel (2 min)

1. Go to [vercel.com](https://vercel.com) → Sign in with GitHub
2. **Add New** → **Project** → Import `taskflow` repo
3. Configure:
   - Framework: **Vite**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://YOUR-RAILWAY-URL.railway.app/api
   ```
5. **Deploy** → Wait 2 minutes → Copy Vercel URL

---

## Step 5: Update Backend CORS (1 min)

1. Go back to Railway → Your backend service → **Variables**
2. Update `CLIENT_URL` with your Vercel URL:
   ```
   CLIENT_URL=https://taskflow-abc123.vercel.app
   ```
3. Save (auto-redeploys)

---

## Step 6: Seed Demo Data (1 min)

1. Railway dashboard → Backend service → **Terminal** tab
2. Run:
   ```bash
   npm run seed
   ```
3. See: "✅ Seed data created successfully!"

---

## Step 7: Test! 🎉

Visit your Vercel URL and login:
- Email: `admin@taskflow.com`
- Password: `password123`

---

## Troubleshooting

### Can't login / Network error
- Check `VITE_API_URL` in Vercel matches Railway URL
- Check `CLIENT_URL` in Railway matches Vercel URL
- Test backend: `https://your-railway-url.railway.app/health`

### MongoDB connection error
- Check `MONGODB_URI` in Railway variables
- Verify MongoDB Atlas allows IP `0.0.0.0/0`
- Check password has no special characters (or URL-encode them)

---

## Update Deployment

Push to GitHub → Auto-deploys to both Vercel and Railway!

```bash
git add .
git commit -m "Update feature"
git push
```

---

## Cost

- **Vercel**: Free (100 GB bandwidth/month)
- **Railway**: $5 free credit/month
- **MongoDB Atlas**: Free (512 MB storage)

**Total: $0/month** for small projects!

---

**Done!** Your TaskFlow app is live in production. 🚀

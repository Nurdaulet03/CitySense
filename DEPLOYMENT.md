# Deployment Guide — CitySense

## Step-by-Step Deployment Instructions

### 1. Fix Build Issue (Windows Permission Error)

If you get `EPERM: operation not permitted` error:

**Option A: Close all Node processes**
```powershell
# Stop all Node processes
Get-Process node | Stop-Process -Force

# Then rebuild
cd frontend
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build
```

**Option B: Restart your terminal/IDE**
- Close VS Code / Cursor
- Close all terminal windows
- Reopen and try building again

### 2. Prepare for Deployment

#### A. Get API Keys

1. **OpenWeatherMap** (Free)
   - Sign up at https://openweathermap.org/api
   - Get your API key from the dashboard
   - Free tier: 1,000 calls/day

2. **MongoDB Atlas** (Free)
   - Sign up at https://www.mongodb.com/cloud/atlas
   - Create a free M0 cluster
   - Create database user
   - Whitelist IP: `0.0.0.0/0` (for development)
   - Copy connection string: `mongodb+srv://user:pass@cluster.mongodb.net/citysense`

3. **OpenAI** (Optional, paid)
   - Get API key from https://platform.openai.com/api-keys
   - If you skip this, AI features will use rule-based fallback

#### B. Initialize Git (if not done)

```bash
cd C:\Users\Zhanbolat\Desktop\zhanbo\city-sense
git add .
git commit -m "Ready for deployment"
```

### 3. Deploy Backend to Railway

1. **Push to GitHub**
   ```bash
   # Create repo on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/city-sense.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to https://railway.app
   - Sign up/login with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `city-sense` repository
   - Railway might auto-detect, but if not:
     - Go to Settings → Root Directory → Set to `backend`
   - Add Environment Variables:
     ```
     MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/citysense
     SESSION_SECRET=generate_random_string_here_min_32_chars
     OPENWEATHER_API_KEY=your_openweather_key
     OPENAI_API_KEY=your_openai_key_optional
     FRONTEND_URL=https://your-frontend.vercel.app
     NODE_ENV=production
     ```
   - Railway will deploy and give you a URL like: `https://citysense-production.up.railway.app`
   - **Copy this URL** — you'll need it for frontend

### 4. Deploy Frontend to Vercel

1. **Deploy on Vercel**
   - Go to https://vercel.com
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Import your `city-sense` repository
   - **Important Settings:**
     - Root Directory: `frontend`
     - Framework Preset: Next.js (auto-detected)
   - Add Environment Variables:
     ```
     NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api
     NEXT_PUBLIC_DEFAULT_LAT=43.238949
     NEXT_PUBLIC_DEFAULT_LNG=76.945465
     NEXT_PUBLIC_DEFAULT_CITY=Almaty
     ```
   - Click "Deploy"
   - Vercel will give you a URL like: `https://city-sense.vercel.app`

2. **Update Backend CORS**
   - Go back to Railway dashboard
   - Update `FRONTEND_URL` environment variable to your Vercel URL
   - Railway will auto-redeploy

### 5. Test Deployment

1. Visit your Vercel URL
2. Try registering a new account
3. Check if the map loads
4. Test API endpoints

### 6. Troubleshooting

**Backend not connecting?**
- Check Railway logs
- Verify MongoDB Atlas connection string
- Ensure IP is whitelisted in MongoDB Atlas

**Frontend can't reach backend?**
- Check `NEXT_PUBLIC_API_URL` in Vercel
- Verify CORS settings in Railway (`FRONTEND_URL`)
- Check browser console for errors

**Build fails?**
- Check Railway/Vercel build logs
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

## Quick Commands

```bash
# Local development
cd backend && npm run dev
cd frontend && npm run dev

# Build for production
cd frontend && npm run build

# Seed database (local)
cd backend && npm run seed
```

## Production URLs

After deployment, you'll have:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.railway.app/api`

## Environment Variables Summary

### Railway (Backend)
- `MONGODB_URI`
- `SESSION_SECRET`
- `OPENWEATHER_API_KEY`
- `OPENAI_API_KEY` (optional)
- `FRONTEND_URL`
- `NODE_ENV=production`

### Vercel (Frontend)
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_DEFAULT_LAT`
- `NEXT_PUBLIC_DEFAULT_LNG`
- `NEXT_PUBLIC_DEFAULT_CITY`


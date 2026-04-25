# CitySense — Smart Urban Life Platform

AI-powered smart city platform with real-time air quality, traffic, weather monitoring and intelligent recommendations.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or MongoDB Atlas)
- OpenWeatherMap API key (free tier available)
- OpenAI API key (optional, for AI features)

### Local Development

#### Backend
```bash
cd backend
npm install
# Set up .env file (see below)
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
# Set up .env.local file (see below)
npm run dev
```

### Environment Variables

#### Backend (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/citysense
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/citysense

SESSION_SECRET=your_session_secret_here
OPENWEATHER_API_KEY=your_openweathermap_api_key
OPENAI_API_KEY=your_openai_api_key_optional
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

#### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_DEFAULT_LAT=43.238949
NEXT_PUBLIC_DEFAULT_LNG=76.945465
NEXT_PUBLIC_DEFAULT_CITY=Almaty
```

## 📦 Deployment

### Backend — Railway

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/city-sense.git
   git push -u origin main
   ```

2. **Deploy on Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your `city-sense` repository
   - Railway will auto-detect the `backend` folder
   - Add environment variables:
     - `MONGODB_URI` (use MongoDB Atlas connection string)
     - `SESSION_SECRET` (generate a random string)
     - `OPENWEATHER_API_KEY`
     - `OPENAI_API_KEY` (optional)
     - `FRONTEND_URL` (your Vercel URL after frontend deployment)
     - `NODE_ENV=production`
   - Railway will auto-deploy and give you a URL like `https://your-app.railway.app`

### Frontend — Vercel

1. **Deploy on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project" → Import your GitHub repo
   - Set **Root Directory** to `frontend`
   - Add environment variables:
     - `NEXT_PUBLIC_API_URL` = your Railway backend URL + `/api`
     - `NEXT_PUBLIC_DEFAULT_LAT=43.238949`
     - `NEXT_PUBLIC_DEFAULT_LNG=76.945465`
     - `NEXT_PUBLIC_DEFAULT_CITY=Almaty`
   - Click "Deploy"

2. **Update Backend CORS**
   - After Vercel deployment, update `FRONTEND_URL` in Railway to your Vercel URL

## 🛠️ Features

- ✅ Interactive map with multiple layers (air quality, traffic, weather, events, community notes)
- ✅ Real-time air quality monitoring (PM2.5, PM10, AQI)
- ✅ Traffic congestion visualization
- ✅ Weather integration (OpenWeatherMap)
- ✅ AI-powered daily recommendations
- ✅ "Best Time to Go Out" score
- ✅ AI chat assistant
- ✅ Historical data charts
- ✅ User authentication (MongoDB sessions)
- ✅ Event management
- ✅ Community notes on map

## 📁 Project Structure

```
city-sense/
├── backend/          # Node.js + Express + MongoDB API
│   ├── src/
│   │   ├── models/   # Mongoose models
│   │   ├── routes/   # API routes
│   │   ├── services/ # Business logic (AI, weather, traffic)
│   │   └── index.js  # Server entry
│   ├── Procfile      # Railway deployment
│   └── package.json
│
└── frontend/         # Next.js 14 + TypeScript + Tailwind
    ├── src/
    │   ├── app/      # Next.js App Router pages
    │   ├── components/ # React components
    │   └── lib/      # API client, store (Zustand)
    ├── vercel.json   # Vercel deployment
    └── package.json
```

## 🔧 Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- express-session + connect-mongo (MongoDB sessions)
- OpenAI API (optional)
- OpenWeatherMap API

**Frontend:**
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Leaflet maps
- Recharts
- Zustand state management

## 📝 License

MIT


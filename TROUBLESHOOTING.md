# Troubleshooting Guide

## Chat Assistant Not Working

If the chat shows: *"I apologize, but I'm having trouble processing your request right now..."*

### Most Common Cause: Missing OpenWeatherMap API Key

**Check Railway Environment Variables:**
1. Go to your Railway project dashboard
2. Click on your backend service
3. Go to **Variables** tab
4. Verify `OPENWEATHER_API_KEY` is set and valid

**To Fix:**
1. Get your API key from https://openweathermap.org/api
2. In Railway, add/update the variable:
   ```
   OPENWEATHER_API_KEY=your_actual_api_key_here
   ```
3. Railway will auto-redeploy

### Check Railway Logs

1. In Railway dashboard, click on your service
2. Go to **Deployments** → Click latest deployment → **View Logs**
3. Look for errors like:
   - `OpenWeather weather error:`
   - `Air quality API error:`
   - `Weather API key not configured`

### Verify API Key Works

Test your API key manually:
```bash
curl "https://api.openweathermap.org/data/2.5/weather?lat=43.238949&lon=76.945465&appid=YOUR_API_KEY&units=metric"
```

Should return JSON with weather data. If you get `401` or `Invalid API key`, your key is wrong.

### Other Possible Issues

**1. MongoDB Connection**
- Check `MONGODB_URI` in Railway
- Verify MongoDB Atlas IP whitelist includes Railway IPs (or use `0.0.0.0/0`)

**2. CORS Issues**
- Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
- Should be: `https://your-app.vercel.app` (no trailing slash)

**3. OpenAI API Key (Optional)**
- If `OPENAI_API_KEY` is missing, AI will use rule-based fallback (still works)
- Only needed for GPT-powered responses

## Testing Locally

To test if it's a deployment issue:

```bash
# Backend
cd backend
# Set OPENWEATHER_API_KEY in .env
npm run dev

# Frontend (new terminal)
cd frontend
npm run dev
```

If it works locally but not in production, it's an environment variable issue in Railway.

## Quick Fix Checklist

- [ ] `OPENWEATHER_API_KEY` is set in Railway
- [ ] API key is valid (test with curl)
- [ ] Railway logs show no errors
- [ ] `FRONTEND_URL` matches Vercel URL exactly
- [ ] `MONGODB_URI` is correct
- [ ] Service is deployed and running (check Railway status)

## Still Not Working?

Check Railway logs for the exact error message and share it for further debugging.


const express = require('express');
const aiService = require('../services/ai');
const Recommendation = require('../models/Recommendation');
const Event = require('../models/Event');
const CommunityNote = require('../models/CommunityNote');
const openweather = require('../services/openweather');
const trafficService = require('../services/traffic');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/ai/recommendation — personalized when logged in
router.get('/recommendation', optionalAuth, async (req, res) => {
  try {
    const { lat = 43.238949, lng = 76.945465 } = req.query;
    const userPreferences = req.user?.preferences || null;

    if (!userPreferences) {
      const recentRec = await Recommendation.findOne({
        createdAt: { $gte: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      }).sort({ createdAt: -1 });

      if (recentRec) return res.json(recentRec);
    }

    const rec = await aiService.generateDailyRecommendation(
      parseFloat(lat), parseFloat(lng), req.user?.city || 'Almaty', userPreferences
    );
    const saved = await Recommendation.create(rec);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/chat — context-aware with events, notes, and user preferences
router.post('/chat', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const lat = req.user?.defaultLocation?.lat || 43.238949;
    const lng = req.user?.defaultLocation?.lng || 76.945465;

    let weather = null;
    let airQuality = null;

    try {
      const [weatherData, airQualityData] = await Promise.all([
        openweather.getCurrentWeather(lat, lng).catch(() => null),
        openweather.getAirQuality(lat, lng).catch(() => null),
      ]);
      weather = weatherData;
      airQuality = airQualityData;
    } catch (err) {
      console.error('Error fetching weather/air quality:', err.message);
    }

    const trafficData = trafficService.getTrafficData();
    const avgCongestion = trafficData.length > 0
      ? Math.round(trafficData.reduce((sum, t) => sum + t.congestionScore, 0) / trafficData.length)
      : 0;

    const goOutScore = weather && airQuality
      ? aiService.calculateGoOutScore(weather, airQuality, avgCongestion, req.user?.preferences)
      : null;

    // Fetch events and community notes for richer context
    const [events, communityNotes] = await Promise.all([
      Event.find({ isActive: true, startDate: { $gte: new Date() } })
        .sort({ startDate: 1 }).limit(5).lean().catch(() => []),
      CommunityNote.find({ isActive: true })
        .sort({ createdAt: -1 }).limit(5).populate('author', 'name').lean().catch(() => []),
    ]);

    const context = {
      city: req.user?.city || 'Almaty',
      userName: req.user?.name || null,
      weather,
      airQuality,
      traffic: avgCongestion,
      goOutScore,
      events,
      communityNotes,
      userPreferences: req.user?.preferences || null,
    };

    const response = await aiService.chatWithAI(message, context);
    res.json(response);
  } catch (error) {
    console.error('Chat route error:', error);
    res.status(500).json({
      message: 'I apologize, but I\'m having trouble processing your request right now. Please try again in a moment.',
      source: 'error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// GET /api/ai/go-out-score
router.get('/go-out-score', async (req, res) => {
  try {
    const { lat = 43.238949, lng = 76.945465 } = req.query;

    const [weather, airQuality] = await Promise.all([
      openweather.getCurrentWeather(parseFloat(lat), parseFloat(lng)),
      openweather.getAirQuality(parseFloat(lat), parseFloat(lng)),
    ]);

    const trafficData = trafficService.getTrafficData();
    const avgCongestion = trafficData.reduce((sum, t) => sum + t.congestionScore, 0) / trafficData.length;

    const score = aiService.calculateGoOutScore(weather, airQuality, avgCongestion);

    res.json({
      score,
      weather: {
        temp: weather.temp,
        description: weather.description,
        main: weather.main,
      },
      airQuality: {
        aqi: airQuality.aqi,
        category: airQuality.category,
        pm25: airQuality.pm25,
      },
      traffic: {
        avgCongestion: Math.round(avgCongestion),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


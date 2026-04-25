const express = require('express');
const openweather = require('../services/openweather');
const AirQualityRecord = require('../models/AirQualityRecord');

const router = express.Router();

// GET /api/air-quality/current
router.get('/current', async (req, res) => {
  try {
    const { lat = 43.238949, lng = 76.945465 } = req.query;
    const data = await openweather.getAirQuality(parseFloat(lat), parseFloat(lng));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/air-quality/forecast
router.get('/forecast', async (req, res) => {
  try {
    const { lat = 43.238949, lng = 76.945465 } = req.query;
    const data = await openweather.getAirQualityForecast(parseFloat(lat), parseFloat(lng));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/air-quality/history
router.get('/history', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    const records = await AirQualityRecord.find({
      recordedAt: { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
    })
      .sort({ recordedAt: -1 })
      .limit(500);

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/air-quality/grid - multiple points for map layer
router.get('/grid', async (req, res) => {
  try {
    const {
      latMin = 43.18,
      latMax = 43.32,
      lngMin = 76.85,
      lngMax = 77.05,
      gridSize = 5,
    } = req.query;

    const latStep = (parseFloat(latMax) - parseFloat(latMin)) / parseInt(gridSize);
    const lngStep = (parseFloat(lngMax) - parseFloat(lngMin)) / parseInt(gridSize);

    const points = [];
    for (let i = 0; i <= parseInt(gridSize); i++) {
      for (let j = 0; j <= parseInt(gridSize); j++) {
        points.push({
          lat: parseFloat(latMin) + i * latStep,
          lng: parseFloat(lngMin) + j * lngStep,
        });
      }
    }

    // Fetch air quality for center point and extrapolate with variance
    const centerLat = (parseFloat(latMin) + parseFloat(latMax)) / 2;
    const centerLng = (parseFloat(lngMin) + parseFloat(lngMax)) / 2;
    const centerData = await openweather.getAirQuality(centerLat, centerLng);

    const gridData = points.map(p => {
      const variance = (Math.random() - 0.5) * 0.4;
      const adjustedPm25 = Math.max(0, centerData.pm25 * (1 + variance));
      const adjustedAqi = Math.max(1, Math.min(5, Math.round(centerData.aqi + (Math.random() - 0.5) * 1.5)));
      const aqiMap = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };

      return {
        lat: p.lat,
        lng: p.lng,
        aqi: adjustedAqi,
        category: aqiMap[adjustedAqi],
        pm25: Math.round(adjustedPm25 * 10) / 10,
        pm10: Math.round((centerData.pm10 || 0) * (1 + variance) * 10) / 10,
      };
    });

    res.json(gridData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


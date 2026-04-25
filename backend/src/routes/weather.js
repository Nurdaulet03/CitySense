const express = require('express');
const openweather = require('../services/openweather');
const WeatherRecord = require('../models/WeatherRecord');

const router = express.Router();

// GET /api/weather/current
router.get('/current', async (req, res) => {
  try {
    const { lat = 43.238949, lng = 76.945465 } = req.query;
    const data = await openweather.getCurrentWeather(parseFloat(lat), parseFloat(lng));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/weather/forecast
router.get('/forecast', async (req, res) => {
  try {
    const { lat = 43.238949, lng = 76.945465 } = req.query;
    const data = await openweather.getWeatherForecast(parseFloat(lat), parseFloat(lng));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/weather/history
router.get('/history', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    const records = await WeatherRecord.find({
      recordedAt: { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
    })
      .sort({ recordedAt: -1 })
      .limit(500);

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/weather/grid - weather data points for map layer
router.get('/grid', async (req, res) => {
  try {
    const {
      latMin = 43.18,
      latMax = 43.32,
      lngMin = 76.85,
      lngMax = 77.05,
      gridSize = 4,
    } = req.query;

    const centerLat = (parseFloat(latMin) + parseFloat(latMax)) / 2;
    const centerLng = (parseFloat(lngMin) + parseFloat(lngMax)) / 2;
    const centerWeather = await openweather.getCurrentWeather(centerLat, centerLng);

    const latStep = (parseFloat(latMax) - parseFloat(latMin)) / parseInt(gridSize);
    const lngStep = (parseFloat(lngMax) - parseFloat(lngMin)) / parseInt(gridSize);

    const gridData = [];
    for (let i = 0; i <= parseInt(gridSize); i++) {
      for (let j = 0; j <= parseInt(gridSize); j++) {
        const tempVariance = (Math.random() - 0.5) * 2.5;
        const windVariance = (Math.random() - 0.5) * 1.5;
        gridData.push({
          lat: parseFloat(latMin) + i * latStep,
          lng: parseFloat(lngMin) + j * lngStep,
          temp: Math.round((centerWeather.temp + tempVariance) * 10) / 10,
          feelsLike: Math.round((centerWeather.feelsLike + tempVariance) * 10) / 10,
          humidity: Math.min(100, Math.max(0, centerWeather.humidity + Math.round((Math.random() - 0.5) * 8))),
          windSpeed: Math.max(0, Math.round((centerWeather.windSpeed + windVariance) * 10) / 10),
          windDeg: centerWeather.windDeg,
          description: centerWeather.description,
          icon: centerWeather.icon,
          main: centerWeather.main,
        });
      }
    }

    res.json(gridData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


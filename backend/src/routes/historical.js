const express = require('express');
const AirQualityRecord = require('../models/AirQualityRecord');
const WeatherRecord = require('../models/WeatherRecord');
const TrafficRecord = require('../models/TrafficRecord');
const openweather = require('../services/openweather');

const router = express.Router();

// GET /api/historical/air-quality
router.get('/air-quality', async (req, res) => {
  try {
    const { days = 7, lat = 43.238949, lng = 76.945465 } = req.query;
    const daysNum = parseInt(days);

    // Try to get from DB first
    let records = await AirQualityRecord.find({
      recordedAt: { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
    }).sort({ recordedAt: 1 });

    // If no records, fetch from API
    if (records.length === 0) {
      try {
        const end = Date.now();
        const start = end - daysNum * 24 * 60 * 60 * 1000;
        const apiData = await openweather.getAirQualityHistory(
          parseFloat(lat), parseFloat(lng), start, end
        );

        // Sample every 6 hours to reduce data
        const sampled = apiData.filter((_, i) => i % 6 === 0);
        records = sampled.map(d => ({
          ...d,
          recordedAt: new Date(d.dt * 1000),
          location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        }));
      } catch (e) {
        console.error('Historical air quality API error:', e.message);
      }
    }

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/historical/weather
router.get('/weather', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);

    const records = await WeatherRecord.find({
      recordedAt: { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
    }).sort({ recordedAt: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/historical/traffic
router.get('/traffic', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);

    const records = await TrafficRecord.find({
      recordedAt: { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
    }).sort({ recordedAt: 1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/historical/summary
router.get('/summary', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    const since = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const [airRecords, weatherRecords, trafficRecords] = await Promise.all([
      AirQualityRecord.find({ recordedAt: { $gte: since } }),
      WeatherRecord.find({ recordedAt: { $gte: since } }),
      TrafficRecord.find({ recordedAt: { $gte: since } }),
    ]);

    const summary = {
      period: `Last ${daysNum} days`,
      airQuality: {
        count: airRecords.length,
        avgAqi: airRecords.length > 0
          ? Math.round(airRecords.reduce((s, r) => s + r.aqi, 0) / airRecords.length * 10) / 10
          : null,
        avgPm25: airRecords.length > 0
          ? Math.round(airRecords.reduce((s, r) => s + (r.pm25 || 0), 0) / airRecords.length * 10) / 10
          : null,
      },
      weather: {
        count: weatherRecords.length,
        avgTemp: weatherRecords.length > 0
          ? Math.round(weatherRecords.reduce((s, r) => s + r.temp, 0) / weatherRecords.length * 10) / 10
          : null,
        avgHumidity: weatherRecords.length > 0
          ? Math.round(weatherRecords.reduce((s, r) => s + (r.humidity || 0), 0) / weatherRecords.length)
          : null,
      },
      traffic: {
        count: trafficRecords.length,
        avgCongestion: trafficRecords.length > 0
          ? Math.round(trafficRecords.reduce((s, r) => s + (r.congestionScore || 0), 0) / trafficRecords.length)
          : null,
      },
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


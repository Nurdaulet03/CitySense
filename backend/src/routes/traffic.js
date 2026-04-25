const express = require('express');
const trafficService = require('../services/traffic');
const TrafficRecord = require('../models/TrafficRecord');

const router = express.Router();

// GET /api/traffic/current
router.get('/current', async (req, res) => {
  try {
    const data = trafficService.getTrafficData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/traffic/location
router.get('/location', async (req, res) => {
  try {
    const { lat = 43.238949, lng = 76.945465, radius = 5 } = req.query;
    const data = trafficService.getTrafficForLocation(
      parseFloat(lat),
      parseFloat(lng),
      parseFloat(radius)
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/traffic/history
router.get('/history', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    const records = await TrafficRecord.find({
      recordedAt: { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) },
    })
      .sort({ recordedAt: -1 })
      .limit(500);

    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


const express = require('express');
const Event = require('../models/Event');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const { category, upcoming = 'true' } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (upcoming === 'true') query.startDate = { $gte: new Date() };

    const events = await Event.find(query)
      .populate('createdBy', 'name')
      .sort({ startDate: 1 })
      .limit(50);

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('attendees', 'name');

    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, category, location, startDate, endDate, maxAttendees } = req.body;
    const event = await Event.create({
      title,
      description,
      category,
      location,
      startDate,
      endDate,
      maxAttendees,
      createdBy: req.user._id,
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events/:id/join
router.post('/:id/join', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    if (event.attendees.includes(req.user._id)) {
      return res.status(400).json({ error: 'Already joined this event' });
    }

    if (event.maxAttendees && event.attendees.length >= event.maxAttendees) {
      return res.status(400).json({ error: 'Event is full' });
    }

    event.attendees.push(req.user._id);
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/events/:id/leave
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    event.attendees = event.attendees.filter(id => id.toString() !== req.user._id.toString());
    await event.save();
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


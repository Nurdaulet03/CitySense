const express = require('express');
const CommunityNote = require('../models/CommunityNote');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/community-notes
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    const query = { isActive: true };

    const notes = await CommunityNote.find(query)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/community-notes
router.post('/', auth, async (req, res) => {
  try {
    const { text, category, location } = req.body;

    if (!text || !location) {
      return res.status(400).json({ error: 'Text and location are required' });
    }

    const note = await CommunityNote.create({
      text,
      category: category || 'info',
      location,
      author: req.user._id,
    });

    const populated = await note.populate('author', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/community-notes/:id/like
router.post('/:id/like', auth, async (req, res) => {
  try {
    const note = await CommunityNote.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const userId = req.user._id.toString();
    const isLiked = note.likes.some(id => id.toString() === userId);

    if (isLiked) {
      note.likes = note.likes.filter(id => id.toString() !== userId);
    } else {
      note.likes.push(req.user._id);
    }

    await note.save();
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/community-notes/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await CommunityNote.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    if (note.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    note.isActive = false;
    await note.save();
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


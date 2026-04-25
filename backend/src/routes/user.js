const express = require('express');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// PUT /api/user/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, city, defaultLocation, avatar } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (city) updates.city = city;
    if (defaultLocation) updates.defaultLocation = defaultLocation;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/user/preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const { notifications, interests, healthSensitive, commuteMode, favoriteLocations } = req.body;
    const prefs = {};

    if (notifications !== undefined) prefs['preferences.notifications'] = notifications;
    if (interests) prefs['preferences.interests'] = interests;
    if (healthSensitive !== undefined) prefs['preferences.healthSensitive'] = healthSensitive;
    if (commuteMode) prefs['preferences.commuteMode'] = commuteMode;
    if (favoriteLocations) prefs['preferences.favoriteLocations'] = favoriteLocations;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: prefs }, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/user/password
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


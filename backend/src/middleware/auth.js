const User = require('../models/User');

/**
 * Require authentication — checks session.userId stored in MongoDB
 */
const auth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'Access denied. Please log in.' });
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      // Session references a deleted user — destroy it
      req.session.destroy();
      return res.status(401).json({ error: 'User not found. Session invalidated.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(500).json({ error: 'Authentication failed.' });
  }
};

/**
 * Optional authentication — attaches user if session exists, otherwise continues
 */
const optionalAuth = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      req.user = await User.findById(req.session.userId);
    }
  } catch (e) {
    // Silent fail — user just won't be authenticated
  }
  next();
};

module.exports = { auth, optionalAuth };

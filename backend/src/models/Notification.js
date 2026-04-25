const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['weather_alert', 'air_quality_alert', 'traffic_alert', 'event_reminder', 'recommendation', 'system'],
    required: true,
  },
  title: {
    type: String,
    required: true,
    maxlength: 120,
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'critical'],
    default: 'info',
  },
  read: {
    type: Boolean,
    default: false,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

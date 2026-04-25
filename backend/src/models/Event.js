const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  category: {
    type: String,
    enum: ['concert', 'sports', 'food', 'culture', 'outdoor', 'tech', 'community', 'other'],
    default: 'other',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String },
  },
  city: { type: String, default: 'Almaty' },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  maxAttendees: { type: Number },
  imageUrl: { type: String },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

eventSchema.index({ startDate: 1 });
eventSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('Event', eventSchema);


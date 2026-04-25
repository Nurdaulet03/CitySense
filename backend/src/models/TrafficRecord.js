const mongoose = require('mongoose');

const trafficRecordSchema = new mongoose.Schema({
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  city: { type: String, default: 'Almaty' },
  congestionLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'severe'],
    required: true,
  },
  congestionScore: { type: Number, min: 0, max: 100 },
  speedKmh: { type: Number },
  freeFlowSpeedKmh: { type: Number },
  roadName: { type: String },
  source: { type: String, default: 'generated' },
  recordedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

trafficRecordSchema.index({ recordedAt: -1 });

module.exports = mongoose.model('TrafficRecord', trafficRecordSchema);


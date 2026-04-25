const mongoose = require('mongoose');

const airQualityRecordSchema = new mongoose.Schema({
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  city: { type: String, default: 'Almaty' },
  aqi: { type: Number, required: true },
  pm25: { type: Number },
  pm10: { type: Number },
  no2: { type: Number },
  so2: { type: Number },
  co: { type: Number },
  o3: { type: Number },
  category: {
    type: String,
    enum: ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'],
  },
  source: { type: String, default: 'openweathermap' },
  recordedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

airQualityRecordSchema.index({ recordedAt: -1 });
airQualityRecordSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('AirQualityRecord', airQualityRecordSchema);


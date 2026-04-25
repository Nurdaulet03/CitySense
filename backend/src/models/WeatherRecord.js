const mongoose = require('mongoose');

const weatherRecordSchema = new mongoose.Schema({
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  city: { type: String, default: 'Almaty' },
  temp: { type: Number, required: true },
  feelsLike: { type: Number },
  humidity: { type: Number },
  pressure: { type: Number },
  windSpeed: { type: Number },
  windDeg: { type: Number },
  clouds: { type: Number },
  visibility: { type: Number },
  description: { type: String },
  icon: { type: String },
  main: { type: String },
  uvIndex: { type: Number },
  source: { type: String, default: 'openweathermap' },
  recordedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

weatherRecordSchema.index({ recordedAt: -1 });

module.exports = mongoose.model('WeatherRecord', weatherRecordSchema);


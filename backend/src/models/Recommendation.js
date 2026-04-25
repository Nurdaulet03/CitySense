const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
  city: { type: String, default: 'Almaty' },
  date: { type: Date, required: true },
  goOutScore: { type: Number, min: 0, max: 100 },
  bestTimeSlots: [{
    start: String,
    end: String,
    score: Number,
    reason: String,
  }],
  summary: { type: String },
  tips: [{ type: String }],
  weatherSummary: { type: String },
  airQualitySummary: { type: String },
  trafficSummary: { type: String },
  generatedBy: { type: String, default: 'ai' },
  weatherData: { type: mongoose.Schema.Types.Mixed },
  airQualityData: { type: mongoose.Schema.Types.Mixed },
}, {
  timestamps: true,
});

recommendationSchema.index({ date: -1, city: 1 });

module.exports = mongoose.model('Recommendation', recommendationSchema);


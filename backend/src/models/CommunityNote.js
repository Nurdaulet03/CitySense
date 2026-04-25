const mongoose = require('mongoose');

const communityNoteSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 500 },
  category: {
    type: String,
    enum: ['tip', 'warning', 'recommendation', 'info', 'question'],
    default: 'info',
  },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  city: { type: String, default: 'Almaty' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

communityNoteSchema.index({ 'location.lat': 1, 'location.lng': 1 });

module.exports = mongoose.model('CommunityNote', communityNoteSchema);


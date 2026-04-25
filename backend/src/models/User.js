const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  preferences: {
    notifications: { type: Boolean, default: true },
    favoriteLocations: [{
      name: String,
      lat: Number,
      lng: Number,
    }],
    interests: [{ type: String, enum: ['outdoor', 'sports', 'culture', 'food', 'nature', 'nightlife', 'health', 'tech'] }],
    healthSensitive: { type: Boolean, default: false },
    commuteMode: { type: String, enum: ['walk', 'bike', 'car', 'transit'], default: 'walk' },
  },
  city: {
    type: String,
    default: 'Almaty',
  },
  defaultLocation: {
    lat: { type: Number, default: 43.238949 },
    lng: { type: Number, default: 76.945465 },
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);


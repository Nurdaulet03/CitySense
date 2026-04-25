require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const airQualityRoutes = require('./routes/airQuality');
const weatherRoutes = require('./routes/weather');
const trafficRoutes = require('./routes/traffic');
const eventsRoutes = require('./routes/events');
const communityNotesRoutes = require('./routes/communityNotes');
const aiRoutes = require('./routes/ai');
const historicalRoutes = require('./routes/historical');
const notificationRoutes = require('./routes/notifications');
const cron = require('./services/cron');

const app = express();

// Security middleware
app.use(helmet());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS — must allow credentials for cookie-based sessions
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://city-sense-delta.vercel.app', // Add your Vercel URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Type'],
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session stored in MongoDB via connect-mongo
app.use(session({
  secret: process.env.SESSION_SECRET || 'citysense_session_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    collectionName: 'sessions',
    ttl: 7 * 24 * 60 * 60, // 7 days
  }),
  cookie: {
    httpOnly: true,                                       // JS can't read it — secure
    secure: process.env.NODE_ENV === 'production',        // HTTPS only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,                     // 7 days
  },
}));

// Trust proxy (needed for secure cookies behind Railway / Vercel proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/air-quality', airQualityRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/traffic', trafficRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/community-notes', communityNotesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/historical', historicalRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    cron.startJobs();
    app.listen(PORT, () => {
      console.log(`CitySense API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;

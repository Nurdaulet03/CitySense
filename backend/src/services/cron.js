const cron = require('node-cron');
const AirQualityRecord = require('../models/AirQualityRecord');
const WeatherRecord = require('../models/WeatherRecord');
const TrafficRecord = require('../models/TrafficRecord');
const Recommendation = require('../models/Recommendation');
const Notification = require('../models/Notification');
const User = require('../models/User');
const openweather = require('./openweather');
const traffic = require('./traffic');
const ai = require('./ai');

const DEFAULT_LAT = 43.238949;
const DEFAULT_LNG = 76.945465;

function startJobs() {
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Recording environmental data...');
    try {
      await recordEnvironmentalData();
    } catch (e) {
      console.error('[CRON] Environmental data error:', e.message);
    }
  });

  cron.schedule('0 6 * * *', async () => {
    console.log('[CRON] Generating daily recommendation...');
    try {
      await generateDailyRec();
    } catch (e) {
      console.error('[CRON] Recommendation error:', e.message);
    }
  });

  cron.schedule('*/30 * * * *', async () => {
    console.log('[CRON] Recording traffic data...');
    try {
      await recordTrafficData();
    } catch (e) {
      console.error('[CRON] Traffic data error:', e.message);
    }
  });

  // Generate smart notifications every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('[CRON] Generating smart notifications...');
    try {
      await generateSmartNotifications();
    } catch (e) {
      console.error('[CRON] Notification error:', e.message);
    }
  });

  console.log('[CRON] Scheduled jobs started');
}

async function recordEnvironmentalData() {
  const [weatherData, airData] = await Promise.all([
    openweather.getCurrentWeather(DEFAULT_LAT, DEFAULT_LNG),
    openweather.getAirQuality(DEFAULT_LAT, DEFAULT_LNG),
  ]);

  await WeatherRecord.create({
    location: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
    ...weatherData,
  });

  await AirQualityRecord.create({
    location: { lat: DEFAULT_LAT, lng: DEFAULT_LNG },
    ...airData,
  });
}

async function recordTrafficData() {
  const trafficData = traffic.getTrafficData();
  await TrafficRecord.insertMany(
    trafficData.map(t => ({
      ...t,
      recordedAt: new Date(),
    }))
  );
}

async function generateDailyRec() {
  const rec = await ai.generateDailyRecommendation(DEFAULT_LAT, DEFAULT_LNG);
  await Recommendation.create(rec);
}

async function generateSmartNotifications() {
  let weatherData, airData;
  try {
    [weatherData, airData] = await Promise.all([
      openweather.getCurrentWeather(DEFAULT_LAT, DEFAULT_LNG),
      openweather.getAirQuality(DEFAULT_LAT, DEFAULT_LNG),
    ]);
  } catch {
    return;
  }

  const users = await User.find({ 'preferences.notifications': true }).lean();
  if (!users.length) return;

  const notifications = [];
  const now = new Date();

  for (const user of users) {
    // Avoid duplicate notifications: skip if user has a similar one in the last 4 hours
    const recentCount = await Notification.countDocuments({
      user: user._id,
      createdAt: { $gte: new Date(now - 4 * 60 * 60 * 1000) },
    });
    if (recentCount >= 3) continue;

    // Weather alerts
    if (weatherData.main === 'Thunderstorm') {
      notifications.push({
        user: user._id,
        type: 'weather_alert',
        title: 'Thunderstorm Warning',
        message: `Thunderstorm detected in your area. Current temp: ${Math.round(weatherData.temp)}°C. Stay safe indoors.`,
        severity: 'critical',
        data: { temp: weatherData.temp, main: weatherData.main },
      });
    } else if (weatherData.temp < -15) {
      notifications.push({
        user: user._id,
        type: 'weather_alert',
        title: 'Extreme Cold Warning',
        message: `Temperature has dropped to ${Math.round(weatherData.temp)}°C. Bundle up and limit outdoor exposure.`,
        severity: 'warning',
        data: { temp: weatherData.temp },
      });
    } else if (weatherData.temp > 38) {
      notifications.push({
        user: user._id,
        type: 'weather_alert',
        title: 'Extreme Heat Warning',
        message: `Temperature has reached ${Math.round(weatherData.temp)}°C. Stay hydrated and avoid prolonged sun exposure.`,
        severity: 'warning',
        data: { temp: weatherData.temp },
      });
    }

    // Air quality alerts — stricter for health-sensitive users
    const aqiThreshold = user.preferences?.healthSensitive ? 3 : 4;
    if (airData.aqi >= aqiThreshold) {
      const severity = airData.aqi >= 5 ? 'critical' : 'warning';
      notifications.push({
        user: user._id,
        type: 'air_quality_alert',
        title: `Air Quality: ${airData.category}`,
        message: `AQI is ${airData.aqi} (${airData.category}). PM2.5: ${airData.pm25}μg/m³.${user.preferences?.healthSensitive ? ' As a health-sensitive user, please take extra precautions.' : ' Consider wearing a mask outdoors.'}`,
        severity,
        data: { aqi: airData.aqi, pm25: airData.pm25 },
      });
    }

    // Traffic alerts for car commuters
    if (user.preferences?.commuteMode === 'car') {
      const trafficData = traffic.getTrafficData();
      const avgCongestion = trafficData.reduce((s, t) => s + t.congestionScore, 0) / trafficData.length;
      if (avgCongestion > 70) {
        notifications.push({
          user: user._id,
          type: 'traffic_alert',
          title: 'Heavy Traffic Alert',
          message: `Average congestion is ${Math.round(avgCongestion)}%. Consider public transport or delaying your commute.`,
          severity: 'info',
          data: { avgCongestion: Math.round(avgCongestion) },
        });
      }
    }
  }

  if (notifications.length) {
    await Notification.insertMany(notifications);
    console.log(`[CRON] Created ${notifications.length} notifications`);
  }
}

module.exports = { startJobs };


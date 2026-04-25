const axios = require('axios');

const BASE_URL = 'https://api.openweathermap.org';
const API_KEY = () => process.env.OPENWEATHER_API_KEY;

/**
 * Get current weather data
 */
async function getCurrentWeather(lat, lng) {
  const apiKey = API_KEY();
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    console.warn('OpenWeatherMap API key not configured');
    throw new Error('Weather API key not configured');
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/data/2.5/weather`, {
      params: {
        lat,
        lon: lng,
        appid: apiKey,
        units: 'metric',
      },
      timeout: 10000, // 10 second timeout
    });

    return {
      temp: data.main.temp,
      feelsLike: data.main.feels_like,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      windDeg: data.wind.deg,
      clouds: data.clouds.all,
      visibility: data.visibility,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      main: data.weather[0].main,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('OpenWeather weather error:', errorMsg);
    throw new Error(`Failed to fetch weather data: ${errorMsg}`);
  }
}

/**
 * Get 5-day / 3-hour forecast
 */
async function getWeatherForecast(lat, lng) {
  try {
    const { data } = await axios.get(`${BASE_URL}/data/2.5/forecast`, {
      params: {
        lat,
        lon: lng,
        appid: API_KEY(),
        units: 'metric',
      },
    });

    return data.list.map(item => ({
      dt: item.dt,
      dateText: item.dt_txt,
      temp: item.main.temp,
      feelsLike: item.main.feels_like,
      humidity: item.main.humidity,
      description: item.weather[0].description,
      icon: item.weather[0].icon,
      main: item.weather[0].main,
      windSpeed: item.wind.speed,
      clouds: item.clouds.all,
    }));
  } catch (error) {
    console.error('OpenWeather forecast error:', error.message);
    throw new Error('Failed to fetch forecast data');
  }
}

/**
 * Get air quality data
 */
async function getAirQuality(lat, lng) {
  const apiKey = API_KEY();
  if (!apiKey || apiKey === 'your_openweathermap_api_key_here') {
    console.warn('OpenWeatherMap API key not configured');
    throw new Error('Air quality API key not configured');
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/data/2.5/air_pollution`, {
      params: {
        lat,
        lon: lng,
        appid: apiKey,
      },
      timeout: 10000, // 10 second timeout
    });

    const item = data.list[0];
    const aqiMap = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };

    return {
      aqi: item.main.aqi,
      category: aqiMap[item.main.aqi] || 'Unknown',
      pm25: item.components.pm2_5,
      pm10: item.components.pm10,
      no2: item.components.no2,
      so2: item.components.so2,
      co: item.components.co,
      o3: item.components.o3,
    };
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.error('OpenWeather air quality error:', errorMsg);
    throw new Error(`Failed to fetch air quality data: ${errorMsg}`);
  }
}

/**
 * Get air quality forecast (5 days)
 */
async function getAirQualityForecast(lat, lng) {
  try {
    const { data } = await axios.get(`${BASE_URL}/data/2.5/air_pollution/forecast`, {
      params: {
        lat,
        lon: lng,
        appid: API_KEY(),
      },
    });

    const aqiMap = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };

    return data.list.map(item => ({
      dt: item.dt,
      aqi: item.main.aqi,
      category: aqiMap[item.main.aqi] || 'Unknown',
      pm25: item.components.pm2_5,
      pm10: item.components.pm10,
      no2: item.components.no2,
      co: item.components.co,
      o3: item.components.o3,
    }));
  } catch (error) {
    console.error('OpenWeather air forecast error:', error.message);
    throw new Error('Failed to fetch air quality forecast');
  }
}

/**
 * Get historical air quality data
 */
async function getAirQualityHistory(lat, lng, start, end) {
  try {
    const { data } = await axios.get(`${BASE_URL}/data/2.5/air_pollution/history`, {
      params: {
        lat,
        lon: lng,
        start: Math.floor(start / 1000),
        end: Math.floor(end / 1000),
        appid: API_KEY(),
      },
    });

    const aqiMap = { 1: 'Good', 2: 'Fair', 3: 'Moderate', 4: 'Poor', 5: 'Very Poor' };

    return data.list.map(item => ({
      dt: item.dt,
      aqi: item.main.aqi,
      category: aqiMap[item.main.aqi] || 'Unknown',
      pm25: item.components.pm2_5,
      pm10: item.components.pm10,
      no2: item.components.no2,
      co: item.components.co,
      o3: item.components.o3,
    }));
  } catch (error) {
    console.error('OpenWeather air history error:', error.message);
    throw new Error('Failed to fetch air quality history');
  }
}

module.exports = {
  getCurrentWeather,
  getWeatherForecast,
  getAirQuality,
  getAirQualityForecast,
  getAirQualityHistory,
};


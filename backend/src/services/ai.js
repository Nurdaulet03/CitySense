const OpenAI = require('openai');
const openweather = require('./openweather');
const traffic = require('./traffic');

let openai;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

/**
 * Generate daily recommendation using AI, optionally personalized with user prefs
 */
async function generateDailyRecommendation(lat, lng, city = 'Almaty', userPreferences = null) {
  const [weather, airQuality, trafficData] = await Promise.all([
    openweather.getCurrentWeather(lat, lng),
    openweather.getAirQuality(lat, lng),
    traffic.getTrafficData(),
  ]);

  const avgCongestion = trafficData.reduce((sum, t) => sum + t.congestionScore, 0) / trafficData.length;

  const goOutScore = calculateGoOutScore(weather, airQuality, avgCongestion, userPreferences);
  const bestTimeSlots = calculateBestTimeSlots(weather, airQuality);

  let summary, tips;

  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
    try {
      const aiResult = await getAISummary(weather, airQuality, avgCongestion, goOutScore, city, userPreferences);
      summary = aiResult.summary;
      tips = aiResult.tips;
    } catch (e) {
      console.error('AI summary failed, using fallback:', e.message);
      const fallback = getRuleBasedSummary(weather, airQuality, avgCongestion, goOutScore, userPreferences);
      summary = fallback.summary;
      tips = fallback.tips;
    }
  } else {
    const fallback = getRuleBasedSummary(weather, airQuality, avgCongestion, goOutScore, userPreferences);
    summary = fallback.summary;
    tips = fallback.tips;
  }

  return {
    city,
    date: new Date(),
    goOutScore,
    bestTimeSlots,
    summary,
    tips,
    weatherSummary: `${weather.description}, ${Math.round(weather.temp)}°C, humidity ${weather.humidity}%`,
    airQualitySummary: `AQI: ${airQuality.aqi} (${airQuality.category}), PM2.5: ${airQuality.pm25}μg/m³`,
    trafficSummary: `Average congestion: ${Math.round(avgCongestion)}%`,
    weatherData: weather,
    airQualityData: airQuality,
  };
}

function calculateGoOutScore(weather, airQuality, avgCongestion, userPreferences = null) {
  let score = 100;

  // Weather impact (max -40)
  if (weather.temp < -10) score -= 30;
  else if (weather.temp < 0) score -= 15;
  else if (weather.temp > 35) score -= 25;
  else if (weather.temp > 30) score -= 10;

  if (weather.main === 'Rain') score -= 20;
  else if (weather.main === 'Snow') score -= 15;
  else if (weather.main === 'Thunderstorm') score -= 35;

  if (weather.windSpeed > 15) score -= 15;
  else if (weather.windSpeed > 10) score -= 5;

  // Air quality impact (max -40)
  const aqiPenalty = { 1: 0, 2: -5, 3: -15, 4: -30, 5: -40 };
  score += aqiPenalty[airQuality.aqi] || 0;

  // Traffic impact (max -20)
  if (avgCongestion > 70) score -= 15;
  else if (avgCongestion > 50) score -= 8;

  // Personalization adjustments
  if (userPreferences) {
    if (userPreferences.healthSensitive && airQuality.aqi >= 3) {
      score -= 10;
    }

    if (userPreferences.commuteMode === 'bike' || userPreferences.commuteMode === 'walk') {
      if (weather.main === 'Rain' || weather.main === 'Snow') score -= 10;
      if (weather.windSpeed > 8) score -= 5;
    }

    if (userPreferences.commuteMode === 'car' && avgCongestion > 60) {
      score -= 10;
    }

    const interests = userPreferences.interests || [];
    if (interests.includes('outdoor') || interests.includes('sports')) {
      if (weather.temp >= 15 && weather.temp <= 28 && airQuality.aqi <= 2) {
        score += 5;
      }
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateBestTimeSlots(weather, airQuality) {
  const slots = [];
  const now = new Date();
  const hour = now.getHours();

  // Morning slot
  if (hour <= 10) {
    slots.push({
      start: '07:00',
      end: '09:00',
      score: 75,
      reason: 'Fresh morning air, light traffic',
    });
  }

  // Midday
  if (weather.temp >= 5 && weather.temp <= 28 && airQuality.aqi <= 3) {
    slots.push({
      start: '11:00',
      end: '14:00',
      score: 80,
      reason: 'Pleasant temperature, acceptable air quality',
    });
  }

  // Afternoon
  slots.push({
    start: '15:00',
    end: '17:00',
    score: airQuality.aqi <= 2 ? 85 : 60,
    reason: airQuality.aqi <= 2 ? 'Good conditions for outdoor activities' : 'Moderate conditions',
  });

  // Evening
  if (weather.temp >= 10) {
    slots.push({
      start: '19:00',
      end: '21:00',
      score: 70,
      reason: 'Cooler evening, reduced traffic',
    });
  }

  return slots.sort((a, b) => b.score - a.score);
}

async function getAISummary(weather, airQuality, avgCongestion, goOutScore, city, userPreferences = null) {
  const client = getOpenAI();

  let prefsContext = '';
  if (userPreferences) {
    const parts = [];
    if (userPreferences.interests?.length) parts.push(`Interests: ${userPreferences.interests.join(', ')}`);
    if (userPreferences.commuteMode) parts.push(`Commute mode: ${userPreferences.commuteMode}`);
    if (userPreferences.healthSensitive) parts.push('Health-sensitive (needs extra air quality warnings)');
    if (parts.length) prefsContext = `\n\nUser preferences:\n- ${parts.join('\n- ')}`;
  }

  const prompt = `You are a smart city advisor for ${city}. Based on current conditions, provide a brief daily recommendation.

Current conditions:
- Weather: ${weather.description}, ${Math.round(weather.temp)}°C, feels like ${Math.round(weather.feelsLike)}°C, wind ${weather.windSpeed}m/s, humidity ${weather.humidity}%
- Air Quality: AQI level ${airQuality.aqi} (${airQuality.category}), PM2.5: ${airQuality.pm25}μg/m³, PM10: ${airQuality.pm10}μg/m³
- Traffic: Average congestion ${Math.round(avgCongestion)}%
- Go-out score: ${goOutScore}/100${prefsContext}

Provide:
1. A brief 2-3 sentence summary of today's conditions${userPreferences ? ', personalized to the user' : ''}
2. 4-5 practical tips for the day${userPreferences ? ' tailored to their preferences' : ''}

Respond in JSON format:
{
  "summary": "...",
  "tips": ["tip1", "tip2", "tip3", "tip4"]
}`;

  const response = await client.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content);
}

function getRuleBasedSummary(weather, airQuality, avgCongestion, goOutScore, userPreferences = null) {
  let summary = '';
  const tips = [];

  if (goOutScore >= 70) {
    summary = `Great day in the city! ${weather.description} with ${Math.round(weather.temp)}°C. `;
  } else if (goOutScore >= 40) {
    summary = `Decent conditions today. ${weather.description} at ${Math.round(weather.temp)}°C. `;
  } else {
    summary = `Challenging conditions today. ${weather.description} at ${Math.round(weather.temp)}°C. `;
  }

  if (airQuality.aqi <= 2) {
    summary += `Air quality is ${airQuality.category.toLowerCase()}, safe for outdoor activities.`;
  } else {
    summary += `Air quality is ${airQuality.category.toLowerCase()} — consider limiting outdoor exposure.`;
  }

  if (weather.temp < 0) tips.push('Bundle up! Temperatures are below freezing.');
  if (weather.temp > 30) tips.push('Stay hydrated and seek shade during peak hours.');
  if (airQuality.aqi >= 4) tips.push('Wear a mask outdoors. Air quality is poor.');
  if (airQuality.aqi <= 2) tips.push('Great air quality — perfect for jogging or cycling.');
  if (avgCongestion > 60) tips.push('Heavy traffic expected. Consider public transport.');
  if (avgCongestion <= 40) tips.push('Light traffic — good time for driving around the city.');
  if (weather.main === 'Rain') tips.push('Don\'t forget your umbrella!');
  if (weather.windSpeed > 10) tips.push('Strong winds — secure loose items outdoors.');

  // Personalized tips based on user preferences
  if (userPreferences) {
    const interests = userPreferences.interests || [];
    if (userPreferences.healthSensitive && airQuality.aqi >= 3) {
      tips.unshift('Health alert: Air quality may affect sensitive individuals. Consider staying indoors.');
    }
    if (userPreferences.commuteMode === 'bike') {
      if (weather.main === 'Clear' || weather.main === 'Clouds') {
        tips.push('Good cycling weather — enjoy your ride!');
      } else {
        tips.push('Consider alternative transport today — cycling conditions are not ideal.');
      }
    }
    if (userPreferences.commuteMode === 'walk' && weather.temp >= 10 && weather.temp <= 25) {
      tips.push('Perfect walking weather for your commute!');
    }
    if (interests.includes('outdoor') && goOutScore >= 60) {
      tips.push('Great conditions for outdoor activities you enjoy!');
    }
    if (interests.includes('food') && weather.main !== 'Rain') {
      tips.push('Nice day to explore outdoor dining options in the city.');
    }
    if (interests.includes('sports') && airQuality.aqi <= 2 && weather.temp >= 5) {
      tips.push('Conditions are ideal for outdoor sports today.');
    }
  }

  tips.push('Check the map for real-time updates before heading out.');

  return { summary, tips: tips.slice(0, 6) };
}

/**
 * AI Chat assistant — context-aware with events, notes, and user preferences
 */
async function chatWithAI(message, context = {}) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
    return getRuleBasedChatResponse(message, context);
  }

  try {
    const client = getOpenAI();

    let eventsContext = '';
    if (context.events?.length) {
      const eventList = context.events.slice(0, 5).map(e =>
        `  - ${e.title} (${e.category}) at ${e.location?.address || 'city center'}, ${new Date(e.startDate).toLocaleDateString()}`
      ).join('\n');
      eventsContext = `\n\nUpcoming city events:\n${eventList}`;
    }

    let notesContext = '';
    if (context.communityNotes?.length) {
      const noteList = context.communityNotes.slice(0, 5).map(n =>
        `  - "${n.text}" (${n.category}) by ${n.author?.name || 'Anonymous'}`
      ).join('\n');
      notesContext = `\n\nRecent community notes:\n${noteList}`;
    }

    let prefsContext = '';
    if (context.userPreferences) {
      const p = context.userPreferences;
      const parts = [];
      if (p.interests?.length) parts.push(`interests: ${p.interests.join(', ')}`);
      if (p.commuteMode) parts.push(`commutes by ${p.commuteMode}`);
      if (p.healthSensitive) parts.push('health-sensitive');
      if (parts.length) prefsContext = `\n\nUser profile: ${parts.join(', ')}`;
    }

    const systemPrompt = `You are CitySense AI, a smart city assistant for ${context.city || 'Almaty'}. 
You help citizens with information about weather, air quality, traffic, events, and city life.

Current city data:
${context.weather ? `- Weather: ${context.weather.description}, ${Math.round(context.weather.temp)}°C, feels like ${Math.round(context.weather.feelsLike)}°C` : ''}
${context.airQuality ? `- Air Quality: AQI ${context.airQuality.aqi} (${context.airQuality.category}), PM2.5: ${context.airQuality.pm25}μg/m³` : ''}
${context.traffic ? `- Traffic: Average congestion ${context.traffic}%` : ''}
${context.goOutScore ? `- Go-out score: ${context.goOutScore}/100` : ''}${eventsContext}${notesContext}${prefsContext}

Be helpful, concise, and provide actionable advice. Reference specific map data (events, air quality zones, traffic roads) when relevant. If the user has preferences, tailor your advice to them.`;

    const response = await client.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      temperature: 0.7,
      max_tokens: 600,
    });

    return {
      message: response.choices[0].message.content,
      source: 'ai',
    };
  } catch (e) {
    console.error('AI chat error:', e.message);
    return getRuleBasedChatResponse(message, context);
  }
}

function getRuleBasedChatResponse(message, context) {
  const lower = message.toLowerCase();
  let response = '';

  if (lower.includes('weather') || lower.includes('temperature')) {
    if (context.weather) {
      response = `Current weather: ${context.weather.description}, ${Math.round(context.weather.temp)}°C (feels like ${Math.round(context.weather.feelsLike)}°C). Wind: ${context.weather.windSpeed}m/s, Humidity: ${context.weather.humidity}%.`;
      if (context.userPreferences?.commuteMode === 'bike' && context.weather.main === 'Rain') {
        response += ' Since you commute by bike, you might want to use alternative transport today.';
      }
    } else {
      response = 'I can provide weather information when you enable location services. Check the weather layer on the map for visual data.';
    }
  } else if (lower.includes('air') || lower.includes('pollution') || lower.includes('quality')) {
    if (context.airQuality) {
      response = `Air Quality Index: ${context.airQuality.aqi} (${context.airQuality.category}). PM2.5: ${context.airQuality.pm25}μg/m³. ${context.airQuality.aqi >= 4 ? 'Consider wearing a mask outdoors.' : 'Safe for outdoor activities.'}`;
      if (context.userPreferences?.healthSensitive && context.airQuality.aqi >= 3) {
        response += ' Given your health sensitivity, take extra precautions when going outside.';
      }
    } else {
      response = 'Check the air quality layer on the map for real-time pollution data across the city.';
    }
  } else if (lower.includes('traffic') || lower.includes('road') || lower.includes('congestion') || lower.includes('route')) {
    if (context.traffic) {
      response = `Average traffic congestion is ${context.traffic}%. ${context.traffic > 60 ? 'Heavy traffic expected — consider alternative routes or public transport.' : 'Traffic is relatively light right now.'}`;
      if (context.userPreferences?.commuteMode) {
        const mode = context.userPreferences.commuteMode;
        if (mode === 'car' && context.traffic > 60) {
          response += ' Since you drive, consider leaving earlier or taking side roads.';
        } else if (mode === 'transit') {
          response += ' Public transit may be a better option during peak hours.';
        }
      }
    } else {
      response = 'Enable the traffic layer on the map to see real-time congestion data.';
    }
  } else if (lower.includes('go out') || lower.includes('outside') || lower.includes('best time')) {
    if (context.goOutScore) {
      response = `Today's go-out score is ${context.goOutScore}/100. ${context.goOutScore >= 70 ? 'Great day to be outside!' : context.goOutScore >= 40 ? 'Decent conditions, but check specific areas on the map.' : 'Consider staying indoors or limiting outdoor time.'}`;
    } else {
      response = 'Check the daily recommendation panel for the best time to go outside based on weather, air quality, and traffic.';
    }
  } else if (lower.includes('event') || lower.includes('activity') || lower.includes('things to do')) {
    if (context.events?.length) {
      const upcoming = context.events.slice(0, 3).map(e => `• ${e.title} (${e.category})`).join('\n');
      response = `Here are some upcoming events:\n${upcoming}\n\nCheck the Events layer on the map for more details and locations.`;
    } else {
      response = 'Check the Events layer on the map to discover upcoming activities near you.';
    }
  } else if (lower.includes('note') || lower.includes('community') || lower.includes('tip')) {
    if (context.communityNotes?.length) {
      const notes = context.communityNotes.slice(0, 3).map(n => `• "${n.text}" — ${n.author?.name || 'Anonymous'}`).join('\n');
      response = `Recent community notes:\n${notes}\n\nToggle the Community Notes layer on the map to see all shared locations.`;
    } else {
      response = 'Enable the Community Notes layer on the map to see tips and notes shared by other citizens.';
    }
  } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    const name = context.userName ? `, ${context.userName}` : '';
    response = `Hello${name}! I'm CitySense AI, your smart city assistant. I can help with weather, air quality, traffic, events, and daily recommendations. What would you like to know?`;
  } else {
    response = `I'm CitySense AI, here to help with city information. Try asking about:\n• Weather conditions\n• Air quality & pollution\n• Traffic congestion & routes\n• Best time to go outside\n• City events & activities\n• Community notes & tips\n\nHow can I help you today?`;
  }

  return { message: response, source: 'rule-based' };
}

module.exports = {
  generateDailyRecommendation,
  chatWithAI,
  calculateGoOutScore,
};


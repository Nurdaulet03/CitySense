const ai = require('../src/services/ai');

describe('AI Service', () => {
  describe('calculateGoOutScore', () => {
    const baseWeather = {
      temp: 22,
      feelsLike: 21,
      main: 'Clear',
      windSpeed: 3,
      humidity: 50,
      description: 'clear sky',
    };
    const baseAirQuality = { aqi: 1, category: 'Good', pm25: 5, pm10: 8 };

    it('returns high score for ideal conditions', () => {
      const score = ai.calculateGoOutScore(baseWeather, baseAirQuality, 20);
      expect(score).toBeGreaterThanOrEqual(80);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('penalizes extreme cold', () => {
      const coldWeather = { ...baseWeather, temp: -15, main: 'Clear' };
      const score = ai.calculateGoOutScore(coldWeather, baseAirQuality, 20);
      expect(score).toBeLessThan(80);
    });

    it('penalizes extreme heat', () => {
      const hotWeather = { ...baseWeather, temp: 38, main: 'Clear' };
      const score = ai.calculateGoOutScore(hotWeather, baseAirQuality, 20);
      expect(score).toBeLessThan(80);
    });

    it('penalizes rain', () => {
      const rainyWeather = { ...baseWeather, main: 'Rain' };
      const score = ai.calculateGoOutScore(rainyWeather, baseAirQuality, 20);
      expect(score).toBeLessThan(90);
    });

    it('penalizes thunderstorm heavily', () => {
      const stormWeather = { ...baseWeather, main: 'Thunderstorm' };
      const score = ai.calculateGoOutScore(stormWeather, baseAirQuality, 20);
      expect(score).toBeLessThan(70);
    });

    it('penalizes poor air quality', () => {
      const poorAir = { ...baseAirQuality, aqi: 5, category: 'Very Poor' };
      const score = ai.calculateGoOutScore(baseWeather, poorAir, 20);
      expect(score).toBeLessThan(70);
    });

    it('penalizes high traffic congestion', () => {
      const score = ai.calculateGoOutScore(baseWeather, baseAirQuality, 80);
      expect(score).toBeLessThan(100);
    });

    it('clamps score to 0-100 range', () => {
      const worstWeather = { ...baseWeather, temp: -20, main: 'Thunderstorm', windSpeed: 20 };
      const worstAir = { ...baseAirQuality, aqi: 5 };
      const score = ai.calculateGoOutScore(worstWeather, worstAir, 90);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('applies health-sensitive penalty from user preferences', () => {
      const airModerate = { ...baseAirQuality, aqi: 3, category: 'Moderate' };
      const withoutPrefs = ai.calculateGoOutScore(baseWeather, airModerate, 30);
      const withPrefs = ai.calculateGoOutScore(baseWeather, airModerate, 30, {
        healthSensitive: true,
      });
      expect(withPrefs).toBeLessThan(withoutPrefs);
    });

    it('penalizes cyclists in bad weather', () => {
      const rainyWeather = { ...baseWeather, main: 'Rain' };
      const withoutPrefs = ai.calculateGoOutScore(rainyWeather, baseAirQuality, 30);
      const withBike = ai.calculateGoOutScore(rainyWeather, baseAirQuality, 30, {
        commuteMode: 'bike',
      });
      expect(withBike).toBeLessThan(withoutPrefs);
    });

    it('boosts outdoor enthusiasts in good conditions', () => {
      const withoutPrefs = ai.calculateGoOutScore(baseWeather, baseAirQuality, 20);
      const withOutdoor = ai.calculateGoOutScore(baseWeather, baseAirQuality, 20, {
        interests: ['outdoor', 'sports'],
      });
      expect(withOutdoor).toBeGreaterThanOrEqual(withoutPrefs);
    });
  });
});

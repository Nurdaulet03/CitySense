const traffic = require('../src/services/traffic');

describe('Traffic Service', () => {
  describe('getTrafficData', () => {
    it('returns array of traffic data for all roads', () => {
      const data = traffic.getTrafficData();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('each road has required fields', () => {
      const data = traffic.getTrafficData();
      for (const road of data) {
        expect(road).toHaveProperty('location');
        expect(road.location).toHaveProperty('lat');
        expect(road.location).toHaveProperty('lng');
        expect(road).toHaveProperty('roadName');
        expect(road).toHaveProperty('congestionScore');
        expect(road).toHaveProperty('congestionLevel');
        expect(road).toHaveProperty('speedKmh');
        expect(road).toHaveProperty('segments');
        expect(road).toHaveProperty('city');
      }
    });

    it('congestion score is between 0 and 100', () => {
      const data = traffic.getTrafficData();
      for (const road of data) {
        expect(road.congestionScore).toBeGreaterThanOrEqual(0);
        expect(road.congestionScore).toBeLessThanOrEqual(100);
      }
    });

    it('congestion level is valid enum', () => {
      const validLevels = ['low', 'moderate', 'high', 'severe'];
      const data = traffic.getTrafficData();
      for (const road of data) {
        expect(validLevels).toContain(road.congestionLevel);
      }
    });

    it('speed is positive', () => {
      const data = traffic.getTrafficData();
      for (const road of data) {
        expect(road.speedKmh).toBeGreaterThanOrEqual(5);
      }
    });

    it('segments are valid coordinate pairs', () => {
      const data = traffic.getTrafficData();
      for (const road of data) {
        expect(Array.isArray(road.segments)).toBe(true);
        expect(road.segments.length).toBeGreaterThanOrEqual(2);
        for (const seg of road.segments) {
          expect(seg.length).toBe(2);
          expect(seg[0]).toBeGreaterThan(40);
          expect(seg[0]).toBeLessThan(50);
          expect(seg[1]).toBeGreaterThan(70);
          expect(seg[1]).toBeLessThan(80);
        }
      }
    });
  });

  describe('getTrafficForLocation', () => {
    it('returns roads within radius', () => {
      const data = traffic.getTrafficForLocation(43.24, 76.95, 10);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('returns empty array for distant location', () => {
      const data = traffic.getTrafficForLocation(0, 0, 1);
      expect(data).toEqual([]);
    });
  });
});

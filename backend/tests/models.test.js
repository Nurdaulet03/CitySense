const mongoose = require('mongoose');

// Inline schema validation tests — no live DB required
describe('Model Schemas', () => {
  describe('Notification schema', () => {
    const Notification = require('../src/models/Notification');

    it('validates required fields', () => {
      const note = new Notification({});
      const err = note.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.user).toBeDefined();
      expect(err.errors.type).toBeDefined();
      expect(err.errors.title).toBeDefined();
      expect(err.errors.message).toBeDefined();
    });

    it('rejects invalid type', () => {
      const note = new Notification({
        user: new mongoose.Types.ObjectId(),
        type: 'invalid_type',
        title: 'Test',
        message: 'Test message',
      });
      const err = note.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.type).toBeDefined();
    });

    it('accepts valid notification', () => {
      const note = new Notification({
        user: new mongoose.Types.ObjectId(),
        type: 'weather_alert',
        title: 'Test Alert',
        message: 'A test alert message',
        severity: 'warning',
      });
      const err = note.validateSync();
      expect(err).toBeUndefined();
    });

    it('defaults read to false', () => {
      const note = new Notification({
        user: new mongoose.Types.ObjectId(),
        type: 'air_quality_alert',
        title: 'AQI Alert',
        message: 'Air quality is poor',
      });
      expect(note.read).toBe(false);
    });

    it('defaults severity to info', () => {
      const note = new Notification({
        user: new mongoose.Types.ObjectId(),
        type: 'system',
        title: 'System',
        message: 'System message',
      });
      expect(note.severity).toBe('info');
    });
  });

  describe('User schema', () => {
    const User = require('../src/models/User');

    it('validates required fields', () => {
      const user = new User({});
      const err = user.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.name).toBeDefined();
      expect(err.errors.email).toBeDefined();
      expect(err.errors.password).toBeDefined();
    });

    it('rejects invalid email format', () => {
      const user = new User({ name: 'Test', email: 'not-an-email', password: '123456' });
      const err = user.validateSync();
      expect(err).toBeDefined();
      expect(err.errors.email).toBeDefined();
    });

    it('sets default preferences', () => {
      const user = new User({ name: 'Test', email: 'test@test.com', password: '123456' });
      expect(user.preferences.notifications).toBe(true);
      expect(user.preferences.healthSensitive).toBe(false);
      expect(user.preferences.commuteMode).toBe('walk');
      expect(user.city).toBe('Almaty');
    });

    it('rejects invalid interest values', () => {
      const user = new User({
        name: 'Test',
        email: 'test@test.com',
        password: '123456',
        preferences: { interests: ['invalid_interest'] },
      });
      const err = user.validateSync();
      expect(err).toBeDefined();
    });

    it('accepts valid interest values', () => {
      const user = new User({
        name: 'Test',
        email: 'test@test.com',
        password: '123456',
        preferences: { interests: ['outdoor', 'sports', 'food'] },
      });
      const err = user.validateSync();
      expect(err).toBeUndefined();
    });
  });
});

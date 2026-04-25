require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../models/Event');
const CommunityNote = require('../models/CommunityNote');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const eventCount = await Event.countDocuments();
    const noteCount = await CommunityNote.countDocuments();
    console.log(`Database has ${eventCount} events and ${noteCount} community notes`);
    console.log('Events and notes are created by users through the app — no seeding needed.');

    await mongoose.disconnect();
    console.log('Done');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();

#!/usr/bin/env node

/**
 * Check and set venue genres in database
 * Run: node check-venue-genres.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Venue = require("./models/Venue");

async function checkAndSetGenres() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/mixmind");
    console.log("✅ Connected to MongoDB\n");

    // Find first venue
    const venues = await Venue.find().limit(5);
    
    if (venues.length === 0) {
      console.log("❌ No venues found in database");
      process.exit(1);
    }

    console.log("📍 Venues in database:\n");
    for (const venue of venues) {
      console.log(`ID: ${venue._id}`);
      console.log(`Name: ${venue.name}`);
      console.log(`Current Genres: ${venue.preferredGenres && venue.preferredGenres.length > 0 ? venue.preferredGenres.join(", ") : "❌ NONE SET"}`);
      console.log(`---`);
    }

    // Set genres on first venue if not set
    if (!venues[0].preferredGenres || venues[0].preferredGenres.length === 0) {
      console.log("\n🔧 Setting default genres on first venue...\n");
      const defaultGenres = ["House", "Techno", "EDM", "Deep House"];
      
      const updated = await Venue.findByIdAndUpdate(
        venues[0]._id,
        { preferredGenres: defaultGenres },
        { new: true }
      );

      console.log(`✅ Updated ${updated.name}`);
      console.log(`📍 New Genres: ${updated.preferredGenres.join(", ")}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

checkAndSetGenres();

#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Clears old test data from MongoDB
 */

require("dotenv").config();
const mongoose = require("mongoose");

// Models
const LivePlaylistSession = require("../models/LivePlaylistSession");
const LivePlaylistTrack = require("../models/LivePlaylistTrack");
const Request = require("../models/Request");

async function cleanDatabase() {
  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected\n");

    // Clear Live Playlist Sessions
    console.log("🗑️  Clearing Live Playlist Sessions...");
    const sessionResult = await LivePlaylistSession.deleteMany({});
    console.log(`  ✅ Deleted ${sessionResult.deletedCount} sessions\n`);

    // Clear Live Playlist Tracks
    console.log("🗑️  Clearing Live Playlist Tracks...");
    const trackResult = await LivePlaylistTrack.deleteMany({});
    console.log(`  ✅ Deleted ${trackResult.deletedCount} tracks\n`);

    // Clear old requests (optional - only delete very old ones)
    console.log("🗑️  Clearing old Requests (older than 7 days)...");
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const requestResult = await Request.deleteMany({
      createdAt: { $lt: sevenDaysAgo }
    });
    console.log(`  ✅ Deleted ${requestResult.deletedCount} old requests\n`);

    // Show remaining data
    console.log("📊 Remaining data:");
    const sessionCount = await LivePlaylistSession.countDocuments();
    const trackCount = await LivePlaylistTrack.countDocuments();
    const requestCount = await Request.countDocuments();

    console.log(`  • Live Playlist Sessions: ${sessionCount}`);
    console.log(`  • Live Playlist Tracks: ${trackCount}`);
    console.log(`  • Requests: ${requestCount}\n`);

    console.log("✅ Database cleanup completed!");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n📊 Disconnected from MongoDB");
  }
}

// Run cleanup
cleanDatabase();

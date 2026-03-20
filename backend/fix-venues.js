const mongoose = require("mongoose");
require("dotenv").config();

const mongoUrl = process.env.MONGODB_URL || "mongodb://localhost:27017/djrequests";

async function fixVenues() {
  try {
    await mongoose.connect(mongoUrl);
    console.log("✅ Connected to MongoDB");

    const Venue = require("./models/Venue");
    
    const result = await Venue.updateMany({}, { livePlaylistActive: false });
    console.log(`✅ Updated ${result.modifiedCount} venues to have livePlaylistActive: false`);
    
    const venues = await Venue.find({}).select("name livePlaylistActive");
    console.log("\n📋 Current venues:");
    venues.forEach(v => {
      console.log(`   - ${v.name}: livePlaylistActive = ${v.livePlaylistActive}`);
    });
    
    await mongoose.disconnect();
    console.log("\n✅ Done! Venues fixed.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

fixVenues();

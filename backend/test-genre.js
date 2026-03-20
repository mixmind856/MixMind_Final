#!/usr/bin/env node

/**
 * Test script to verify Gemini genre detection is working
 * Run: node test-genre.js
 */

require("dotenv").config();
const detectGenre = require("./helper/genreCheck");

const testSongs = [
  { title: "Strings of Life", artist: "Derrick May" },
  { title: "Harley Davidson", artist: "Deadmau5" },
  { title: "Hotel California", artist: "Eagles" },
  { title: "Blinding Lights", artist: "The Weeknd" },
  { title: "HUMBLE.", artist: "Kendrick Lamar" },
  { title: "Come As You Are", artist: "Usher" }
];

async function runTests() {
  console.log("🧪 Testing Gemini Genre Detection\n");
  console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ SET" : "❌ NOT SET"}\n`);

  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY not configured in .env");
    process.exit(1);
  }

  for (const song of testSongs) {
    try {
      console.log(`Testing: "${song.title}" by ${song.artist}`);
      const genre = await detectGenre(song.title, song.artist);
      console.log(`✅ Result: ${genre}\n`);
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log("✅ Genre detection test complete");
  process.exit(0);
}

runTests().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

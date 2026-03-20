const { GoogleGenerativeAI } = require("@google/generative-ai");

// Check if API key is available
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is not set in environment variables!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function detectGenre(title, artist) {
  console.log(`🔍 [GenreCheck] Starting genre detection for: "${title}" by "${artist}"`);
  
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Try with gemini-pro (most stable and available)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Return ONLY the primary genre word for this song. No explanation.

Song: "${title}"
Artist: "${artist}"

Examples: house, techno, edm, hiphop, pop, rock, jazz, soul, ambient, trance, dnb, indie, metal, acoustic, classical`;

    console.log(`📤 [GenreCheck] Sending request to Gemini (gemini-pro)...`);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const genre = text.toLowerCase().trim();
    console.log(`✅ [GenreCheck] Genre detected: "${genre}"`);
    
    return genre;
  } catch (error) {
    console.error(`❌ [GenreCheck] Error detecting genre: ${error.message}`);
    throw error;
  }
}

module.exports = detectGenre;

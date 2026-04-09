const axios = require("axios");

// Last.fm API configuration
const LASTFM_API_KEY = process.env.LASTFM_API_KEY || "2589618cdc49455672c3480cf7c3ce4c";
const LASTFM_BASE_URL = "http://ws.audioscrobbler.com/2.0/";

/**
 * Fetch track information from Last.fm and extract genre tags
 * @param {string} trackName - Song/track name
 * @param {string} artistName - Artist name
 * @returns {Promise<{success: boolean, tags: string[], error?: string}>}
 */
async function getTrackGenreTags(trackName, artistName) {
  try {
    // Trim whitespace from inputs
    const cleanTrackName = (trackName || "").trim();
    const cleanArtistName = (artistName || "").trim();
    
    console.log(`\n🔍 Fetching Last.fm info for: "${cleanTrackName}" by "${cleanArtistName}"`);

    const response = await axios.get(LASTFM_BASE_URL, {
      params: {
        method: "track.getInfo",
        api_key: LASTFM_API_KEY,
        artist: cleanArtistName,
        track: cleanTrackName,
        format: "json"
      },
      timeout: 5000
    });

    if (!response.data.track) {
      console.log(`⚠️  Track not found on Last.fm`);
      return { success: false, tags: [], error: "Track not found on Last.fm" };
    }

    const track = response.data.track;
    const toptags = track.toptags?.tag || [];

    // Extract tag names and filter out empty values
    const tags = Array.isArray(toptags)
      ? toptags.map(tag => tag.name?.toLowerCase()).filter(t => t)
      : (toptags.name ? [toptags.name.toLowerCase()] : []);

    if (tags.length === 0) {
      console.log(`⚠️  No tags found for this track on Last.fm`);
      return { success: true, tags: [], message: "Track found but no tags available" };
    }

    console.log(`✅ Found ${tags.length} genre tags on Last.fm: ${tags.join(", ")}`);

    return {
      success: true,
      tags: tags,
      trackInfo: {
        name: track.name,
        artist: track.artist?.name,
        album: track.album?.title,
        duration: track.duration,
        listeners: track.listeners,
        playcount: track.playcount
      }
    };
  } catch (err) {
    console.error(`❌ Last.fm API error:`, err.message);
    return { success: false, tags: [], error: err.message };
  }
}

/**
 * Check if song genre/tags match venue's preferred genres
 * @param {string[]} songTags - Tags from Last.fm for the song
 * @param {string[]} venueGenres - Preferred genres selected by venue
 * @returns {Promise<{isMatch: boolean, matchedTag: string, songTags: string[], venueGenres: string[]}>}
 */
function checkGenreMatch(songTags, venueGenres) {
  if (!venueGenres || venueGenres.length === 0) {
    console.log(`⚠️  No venue genres configured - accepting all songs`);
    return {
      isMatch: true,
      matchedTag: null,
      songTags,
      venueGenres,
      reason: "No genre restrictions"
    };
  }

  // Normalize venue genres to lowercase
  const normalizedVenueGenres = venueGenres.map(g => g?.toLowerCase());

  // Check if any song tag matches any venue genre
  for (const tag of songTags) {
    if (normalizedVenueGenres.includes(tag)) {
      console.log(`✅ Genre match found: "${tag}"`);
      return {
        isMatch: true,
        matchedTag: tag,
        songTags,
        venueGenres
      };
    }
  }

  console.log(`❌ No genre match found`);
  console.log(`   Song tags: ${songTags.join(", ")}`);
  console.log(`   Venue genres: ${normalizedVenueGenres.join(", ")}`);

  return {
    isMatch: false,
    matchedTag: null,
    songTags,
    venueGenres,
    reason: `Song genres (${songTags.join(", ")}) don't match venue genres (${normalizedVenueGenres.join(", ")})`
  };
}

/**
 * Complete genre validation: fetch from Last.fm and check match
 * @param {string} trackName - Song name
 * @param {string} artistName - Artist name
 * @param {string[]} venueGenres - Venue's preferred genres
 * @returns {Promise<{isValid: boolean, tags: string[], matchedTag: string, error: string}>}
 */
async function validateSongGenre(trackName, artistName, venueGenres) {
  try {
    // Step 1: Fetch from Last.fm
    const lastfmResult = await getTrackGenreTags(trackName, artistName);

    if (!lastfmResult.success) {
      return {
        isValid: false,
        tags: [],
        matchedTag: null,
        error: lastfmResult.error || "Failed to fetch track info"
      };
    }

    // Step 2: Check genre match
    const matchResult = checkGenreMatch(lastfmResult.tags, venueGenres);

    return {
      isValid: matchResult.isMatch,
      tags: lastfmResult.tags,
      matchedTag: matchResult.matchedTag,
      trackInfo: lastfmResult.trackInfo,
      reason: matchResult.reason,
      error: null
    };
  } catch (err) {
    console.error(`❌ Genre validation error:`, err.message);
    return {
      isValid: false,
      tags: [],
      matchedTag: null,
      error: err.message
    };
  }
}

module.exports = {
  getTrackGenreTags,
  checkGenreMatch,
  validateSongGenre
};

const User = require("../../models/User");
const Request = require("../../models/Request");
const detectGenre = require("../../helper/genreCheck");
const { isGenreMatch } = require("../../helper/genrematcher");
const beatsourceQueue = require("../../queues/beatsourceQueue");
const livePlaylistQueue = require("../../queues/livePlaylistQueue");
const songRequestQueue = require("../../queues/songRequestQueue");
const Venue = require("../../models/Venue");
const axios = require("axios");

/* -------------------- UTILITY: SLEEP -------------------- */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* -------------------- CREATE REQUEST -------------------- */
async function createRequest(req, res) {
  try {
    const { name, email, title, artist, price, songTitle, artistName, userName, venueId } = req.body;

    // Use new field names or fallback to old ones for backwards compatibility
    const songName = title || songTitle;
    const artistName_ = artist || artistName;
    const userName_ = name || userName;

    if (!userName_ || !email || !songName || !artistName_) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name: userName_, email, role: "user" });
    }

    // Check if venue has DJ mode enabled and get venue details
    let djModeEnabled = false;
    let venue = null;
    if (venueId) {
      venue = await Venue.findById(venueId);
      djModeEnabled = venue && venue.djMode ? true : false;
    }

    // Determine initial status based on DJ mode
    const initialStatus = djModeEnabled ? "pending_dj_approval" : "queued";

    const requestData = {
      userId: user._id,
      title: songName,
      songTitle: songName,
      artist: artistName_,
      artistName: artistName_,
      userName: userName_,
      price: price || 0,
      status: initialStatus,
      sourcePlaylistId: process.env.SOURCE_PLAYLIST_ID
    };

    // Add venueId if provided
    if (venueId) {
      requestData.venueId = venueId;
    }

    const request = await Request.create(requestData);

    // If DJ mode is enabled, don't queue - just save and show in DJ panel
    if (djModeEnabled) {
      console.log(`📌 DJ Approval Pending - Request ID: ${request._id}, Song: "${songName}"`);
      return res.status(201).json({ 
        requestId: request._id, 
        status: request.status,
        message: "Song request submitted. Awaiting DJ approval.",
        djPending: true
      });
    }

    // If DJ mode is disabled, check genre match (if venue has preferred genres)
    console.log(`\n🔎 GENRE CHECK LOGIC for "${songName}" by "${artistName_}"`);
    console.log(`   DJ Enabled: ${djModeEnabled}`);
    console.log(`   Venue exists: ${!!venue}`);
    console.log(`   Preferred Genres: ${venue && venue.preferredGenres ? JSON.stringify(venue.preferredGenres) : 'N/A'}`);
    console.log(`   Genres count: ${venue && venue.preferredGenres ? venue.preferredGenres.length : 0}`);

    if (!djModeEnabled && venue && venue.preferredGenres && venue.preferredGenres.length > 0) {
      console.log(`✅ PROCEEDING WITH GENRE CHECK...`);
      try {
        console.log(`🎵 Detecting genre for: "${songName}" by "${artistName_}"...`);
        const detectedGenre = await detectGenre(songName, artistName_);
        console.log(`✓ Detected genre: "${detectedGenre}"`);

        // Save detected genre to request
        await Request.findByIdAndUpdate(request._id, { 
          detectedGenre: detectedGenre
        });

        const genreCheckResult = isGenreMatch(detectedGenre, venue.preferredGenres);

        if (!genreCheckResult.isMatch) {
          console.log(`❌ Genre mismatch - Request ID: ${request._id}`);
          console.log(`   Detected: "${genreCheckResult.detectedGenre}", Venue expects: ${JSON.stringify(venue.preferredGenres)}`);
          
          // Update request with genre rejection
          await Request.findByIdAndUpdate(request._id, { 
            status: "rejected",
            rejectionReason: genreCheckResult.message,
            genreCheckPassed: false
          });

          return res.status(400).json({ 
            error: "Genre mismatch",
            message: genreCheckResult.message,
            detectedGenre: genreCheckResult.detectedGenre,
            preferredGenres: genreCheckResult.preferredGenres,
            requestId: request._id
          });
        }

        // Genre matches, update request document for reference
        await Request.findByIdAndUpdate(request._id, { 
          metadata: { 
            detectGenre: genreCheckResult.detectedGenre,
            genreMatch: genreCheckResult.matchedWith
          },
          genreCheckPassed: true
        });

        console.log(`✅ Genre match confirmed - "${genreCheckResult.detectedGenre}" matches "${genreCheckResult.matchedWith}"`);
      } catch (genreErr) {
        console.error(`❌ GENRE DETECTION ERROR: ${genreErr.message}`);
        console.error(`   Stack: ${genreErr.stack}`);
        
        // If genre detection fails, REJECT the request (don't proceed)
        await Request.findByIdAndUpdate(request._id, { 
          status: "rejected",
          rejectionReason: `Genre detection failed: ${genreErr.message}`,
          metadata: { 
            genreCheckError: genreErr.message
          }
        });
        
        console.warn(`⚠️  Genre detection failed for request ${request._id}, REJECTING REQUEST`);
        
        return res.status(400).json({
          error: "Genre detection error",
          message: "Unable to detect song genre. Please try again.",
          requestId: request._id
        });
      }
    } else {
      console.log(`⏭️  SKIPPING GENRE CHECK: DJ=${djModeEnabled}, Venue=${!!venue}, Genres=${venue && venue.preferredGenres ? venue.preferredGenres.length : 0}`);
    }

    // If DJ mode is disabled, add to queue for sequential processing
    try {
      const job = await songRequestQueue.add(
        "process-song-request",
        {
          requestId: request._id.toString(),
          songName,
          artistName: artistName_
        },
        {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 2000
          },
          removeOnComplete: false,
          removeOnFail: false
        }
      );

      console.log(`📌 Queued song request - Job ID: ${job.id}, Request ID: ${request._id}`);

      res.status(201).json({ 
        requestId: request._id, 
        jobId: job.id,
        status: request.status,
        message: "Song request queued successfully"
      });
    } catch (queueErr) {
      console.error("Queue error:", queueErr);
      
      // Update request status to failed if queueing fails
      await Request.findByIdAndUpdate(request._id, { 
        status: "failed",
        flowError: "Failed to queue request"
      });

      res.status(500).json({ 
        error: "Failed to queue request",
        requestId: request._id 
      });
    }
  } catch (err) {
    console.error("Create request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- GET REQUEST BY ID -------------------- */
async function getRequestById(req, res) {
  try {
    const request = await Request.findById(req.params.id).populate("userId");
    if (!request) return res.status(404).json({ error: "Not found" });

    res.json(request);
  } catch (err) {
    console.error("Get request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- VENUE APPROVE REQUEST -------------------- */
async function approveRequest(req, res) {
  try {
    const { id } = req.params;
    const { venueId } = req.body;

    const request = await Request.findById(id).populate("venueId");
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify venue ownership
    if (venueId && request.venueId && request.venueId._id.toString() !== venueId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update status
    request.status = "authorized";
    request.approvedAt = new Date();
    await request.save();

    // Immediately add to MixMind playlist via beatsource
    try {
      console.log(`🎵 Approved! Adding "${request.songTitle || request.title}" to MixMind playlist...`);
      
      const runBeatsourceFlow = require("../../worker/beatsourceClient");
      const result = await runBeatsourceFlow(request);
      
      // Update as completed
      request.status = "completed";
      request.beatSourceTrackId = result?.trackId || null;
      request.resultUrl = result?.url || null;
      await request.save();
      
      console.log(`✅ Song added to playlist!`);
      
      res.json({
        message: "Request approved and added to MixMind playlist!",
        request,
        added: true
      });
    } catch (beatsourceErr) {
      console.error(`❌ Failed to add to playlist:`, beatsourceErr.message);
      
      // Still mark as authorized even if beatsource fails
      // Can retry later via admin panel
      res.json({
        message: "Request approved but playlist add failed. Will retry via queue.",
        request,
        warning: beatsourceErr.message,
        added: false
      });
    }
  } catch (err) {
    console.error("Approve request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- VENUE REJECT REQUEST -------------------- */
async function rejectRequest(req, res) {
  try {
    const { id } = req.params;
    const { venueId, reason } = req.body;

    const request = await Request.findById(id);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify venue ownership
    if (venueId && request.venueId && request.venueId.toString() !== venueId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update status
    request.status = "rejected";
    request.rejectionReason = reason || "Rejected by venue";
    request.rejectedAt = new Date();
    await request.save();

    res.json({
      message: "Request rejected",
      request
    });
  } catch (err) {
    console.error("Reject request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- GET VENUE REQUESTS (PUBLIC) -------------------- */
async function getVenuePublicRequests(req, res) {
  try {
    const { venueId } = req.params;

    const requests = await Request.find({
      venueId: venueId,
      status: "completed"
    })
      .sort({ approvedAt: -1 })
      .limit(50);

    res.json(requests);
  } catch (err) {
    console.error("Get public venue requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- LIVE PLAYLIST ROTATION (3-STEP FLOW) -------------------- */
/**
 * Execute live playlist rotation every 2 minutes
 * Cycles through 500 songs (indices 0-499) in the Mixmind folder
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.baseUrl - Base URL for execute API (default: http://127.0.0.1:80)
 * @param {number} options.totalSongs - Total number of songs to cycle through (default: 500)
 * @param {number} options.intervalMs - Interval between rotations in ms (default: 120000 = 2 minutes)
 * @returns {Promise<void>} - Runs continuously until stopped
 */
async function executeLivePlaylistRotation(options = {}) {
  const baseUrl = options.baseUrl || process.env.EXECUTE_API_URL || "http://127.0.0.1:80";
  const totalSongs = options.totalSongs || 500;
  const intervalMs = options.intervalMs || 120000; // 2 minutes by default
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🎵 LIVE PLAYLIST ROTATION STARTED`);
  console.log(`${'='.repeat(70)}`);
  console.log(`📂 Total Songs: ${totalSongs}`);
  console.log(`⏱️  Rotation Interval: ${intervalMs / 1000}s (${intervalMs / 60000} minutes)`);
  console.log(`${'='.repeat(70)}\n`);
  
  let currentIndex = 0;
  let rotationCount = 0;
  
  while (!SHOULD_STOP) {
    rotationCount++;
    
    try {
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🎵 ROTATION #${rotationCount} | Index: ${currentIndex}/${totalSongs - 1}`);
      console.log(`${'─'.repeat(60)}`);
      
      // Step 1: Go to Mixmind folder
      console.log(`📍 Step 1: Going to Mixmind folder...`);
      const goToFolderScript = `browser_gotofolder "beatsource:\\Mixmind"`;
      const goToFolderUrl = `${baseUrl}/execute?script=${encodeURIComponent(goToFolderScript)}`;
      
      try {
        const goToFolderResponse = await axios.get(goToFolderUrl, { timeout: 10000 });
        console.log(`✓ Step 1 completed`);
      } catch (err) {
        console.error(`✗ Step 1 failed: ${err.message}`);
        throw new Error(`Go to folder failed: ${err.message}`);
      }
      
      // Step 2: Scroll to the current index
      console.log(`📍 Step 2: Scrolling to index ${currentIndex}...`);
      const scrollScript = `browser_scroll ${currentIndex}`;
      const scrollUrl = `${baseUrl}/execute?script=${encodeURIComponent(scrollScript)}`;
      
      try {
        const scrollResponse = await axios.get(scrollUrl, { timeout: 10000 });
        console.log(`✓ Step 2 completed`);
      } catch (err) {
        console.error(`✗ Step 2 failed: ${err.message}`);
        throw new Error(`Scroll failed: ${err.message}`);
      }
      
      // Step 3: Add song to playlist
      console.log(`📍 Step 3: Adding song to playlist...`);
      const addScript = `playlist_add`;
      const addUrl = `${baseUrl}/execute?script=${encodeURIComponent(addScript)}`;
      
      try {
        const addResponse = await axios.get(addUrl, { timeout: 10000 });
        console.log(`✓ Step 3 completed`);
      } catch (err) {
        console.error(`✗ Step 3 failed: ${err.message}`);
        throw new Error(`Add to playlist failed: ${err.message}`);
      }
      
      console.log(`✅ Rotation #${rotationCount} completed successfully`);
      
      // Increment index and cycle back to 0 when reaching totalSongs
      currentIndex = (currentIndex + 1) % totalSongs;
      
      // Wait for interval before next rotation
      console.log(`⏳ Waiting ${intervalMs / 1000}s before next rotation...`);
      await waitWithInterrupt(intervalMs);
      
    } catch (err) {
      console.error(`\n❌ Rotation #${rotationCount} failed: ${err.message}`);
      console.log(`⏳ Waiting 30s before retrying...`);
      
      // On error, still increment index so we don't get stuck
      currentIndex = (currentIndex + 1) % totalSongs;
      
      // Wait before retry
      await waitWithInterrupt(30000);
    }
  }
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🛑 LIVE PLAYLIST ROTATION STOPPED`);
  console.log(`${'='.repeat(70)}\n`);
}

/* -------------------- GET QUEUE STATUS -------------------- */
async function getQueueStatus(req, res) {
  try {
    const queueCounts = await songRequestQueue.getCountsPerStatus();
    const allJobs = await songRequestQueue.getJobCounts();
    const activeJobs = await songRequestQueue.getActiveCount();
    const waitingJobs = await songRequestQueue.getWaitingCount();
    const failedJobs = await songRequestQueue.getFailedCount();
    const completedJobs = await songRequestQueue.getCompletedCount();

    res.json({
      status: "ok",
      queue: {
        active: activeJobs,
        waiting: waitingJobs,
        failed: failedJobs,
        completed: completedJobs,
        total: allJobs || {}
      },
      message: `Queue status: ${activeJobs} processing, ${waitingJobs} waiting, ${failedJobs} failed`
    });
  } catch (err) {
    console.error("Get queue status error:", err);
    res.status(500).json({ error: "Failed to get queue status" });
  }
}

module.exports = { 
  createRequest, 
  getRequestById,
  approveRequest,
  rejectRequest,
  getVenuePublicRequests,
  executeLivePlaylistRotation,
  getQueueStatus
};

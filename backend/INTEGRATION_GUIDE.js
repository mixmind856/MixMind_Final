/**
 * Integration Guide - Live Playlist Worker
 * 
 * This file explains how to trigger and manage the worker from your API
 */

// ============================================================================
// EXAMPLE 1: Start Live Playlist Worker (from API Controller)
// ============================================================================

const { startWorker } = require("../worker/runLivePlaylistFlow");
const LivePlaylistSession = require("../models/LivePlaylistSession");
const Venue = require("../models/Venue");

/**
 * Start Live Playlist for a Venue
 * 
 * POST /api/venue/:venueId/live-playlist/start
 * 
 * This endpoint:
 * 1. Creates a LivePlaylistSession in database
 * 2. Spawns worker process with session ID
 * 3. Returns session info to client
 */
async function startLivePlaylist(req, res) {
  try {
    const { venueId } = req.params;

    // 1. Verify venue exists
    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // 2. Check if session already active
    const existingSession = await LivePlaylistSession.findOne({
      venueId: venueId,
      status: "active"
    });

    if (existingSession) {
      return res.status(400).json({
        error: "Live playlist already active for this venue",
        sessionId: existingSession._id
      });
    }

    // 3. Create new session
    const session = new LivePlaylistSession({
      venueId: venueId,
      status: "active",
      tracks: [],
      startedAt: new Date()
    });

    await session.save();

    console.log(`\n✅ Created LivePlaylistSession: ${session._id} for venue: ${venueId}`);

    // 4. Spawn worker process
    const { spawn } = require("child_process");
    const workerProcess = spawn("node", [
      "worker/runLivePlaylistFlow.js",
      session._id.toString()
    ]);

    // Store process for later reference
    if (!global.livePlaylistWorkers) {
      global.livePlaylistWorkers = {};
    }
    global.livePlaylistWorkers[session._id.toString()] = workerProcess;

    // Handle worker output
    workerProcess.stdout.on("data", (data) => {
      console.log(`[${session._id}] ${data}`);
    });

    workerProcess.stderr.on("data", (data) => {
      console.error(`[${session._id}] ERROR: ${data}`);
    });

    workerProcess.on("close", (code) => {
      console.log(`\n🛑 Worker process closed (code: ${code}) for session: ${session._id}`);
      delete global.livePlaylistWorkers[session._id.toString()];
      
      // Update session status
      LivePlaylistSession.updateOne(
        { _id: session._id },
        {
          status: "stopped",
          stoppedAt: new Date()
        }
      ).catch(err => console.error("Error updating session:", err));
    });

    // 5. Return session info
    return res.status(201).json({
      success: true,
      message: "Live playlist started",
      session: {
        sessionId: session._id,
        venueId: venue._id,
        venueName: venue.name,
        status: session.status,
        startedAt: session.startedAt
      }
    });

  } catch (error) {
    console.error("Error starting live playlist:", error);
    return res.status(500).json({
      error: "Failed to start live playlist",
      message: error.message
    });
  }
}


// ============================================================================
// EXAMPLE 2: Stop Live Playlist Worker
// ============================================================================

/**
 * Stop Live Playlist for a Venue
 * 
 * POST /api/venue/:venueId/live-playlist/stop
 * 
 * This endpoint:
 * 1. Finds active session
 * 2. Terminates worker process
 * 3. Updates session status
 */
async function stopLivePlaylist(req, res) {
  try {
    const { venueId } = req.params;

    // 1. Find active session
    const session = await LivePlaylistSession.findOne({
      venueId: venueId,
      status: "active"
    });

    if (!session) {
      return res.status(404).json({
        error: "No active live playlist session for this venue"
      });
    }

    // 2. Kill worker process
    const sessionId = session._id.toString();
    const workerProcess = global.livePlaylistWorkers?.[sessionId];

    if (workerProcess) {
      console.log(`\n🛑 Killing worker process for session: ${sessionId}`);
      workerProcess.kill("SIGTERM"); // Graceful shutdown
      
      // Wait a bit, then force kill if needed
      setTimeout(() => {
        if (!workerProcess.killed) {
          workerProcess.kill("SIGKILL");
        }
      }, 5000);
    }

    // 3. Update session status
    session.status = "stopped";
    session.stoppedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      message: "Live playlist stopped",
      session: {
        sessionId: session._id,
        status: session.status,
        stoppedAt: session.stoppedAt
      }
    });

  } catch (error) {
    console.error("Error stopping live playlist:", error);
    return res.status(500).json({
      error: "Failed to stop live playlist",
      message: error.message
    });
  }
}


// ============================================================================
// EXAMPLE 3: Get Live Playlist Status
// ============================================================================

/**
 * Get Live Playlist Status for a Venue
 * 
 * GET /api/venue/:venueId/live-playlist/status
 * 
 * Returns:
 * - Session info
 * - Current tracks
 * - Batch timing info
 * - Worker status
 */
async function getLivePlaylistStatus(req, res) {
  try {
    const { venueId } = req.params;

    // Find active or most recent session
    const session = await LivePlaylistSession.findOne({
      venueId: venueId
    })
    .populate("tracks")
    .sort({ createdAt: -1 })
    .limit(1);

    if (!session) {
      return res.status(404).json({
        error: "No live playlist session found for this venue"
      });
    }

    const sessionId = session._id.toString();
    const workerProcess = global.livePlaylistWorkers?.[sessionId];

    return res.status(200).json({
      success: true,
      session: {
        sessionId: session._id,
        venueId: session.venueId,
        status: session.status,
        active: workerProcess ? true : false,
        
        // Batch timing info
        batchId: session.batchId,
        batchStartedAt: session.batchStartedAt,
        batchTotalDurationMs: session.batchTotalDurationMs,
        fiftyPercentThresholdMs: session.fiftyPercentThresholdMs,
        
        // Current tracks
        tracks: session.tracks.map(track => ({
          _id: track._id,
          title: track.title,
          artist: track.artist,
          duration: track.duration,
          status: track.status,
          addedAt: track.addedAt
        })),
        trackCount: session.tracks.length,
        
        // Timing info
        startedAt: session.startedAt,
        stoppedAt: session.stoppedAt,
        lastUpdatedAt: session.lastUpdatedAt,
        
        // Process info
        workerPID: workerProcess?.pid || null,
        isRunning: workerProcess ? true : false
      }
    });

  } catch (error) {
    console.error("Error getting live playlist status:", error);
    return res.status(500).json({
      error: "Failed to get live playlist status",
      message: error.message
    });
  }
}


// ============================================================================
// EXAMPLE 4: Get Live Playlist History
// ============================================================================

/**
 * Get Live Playlist History and Stats
 * 
 * GET /api/venue/:venueId/live-playlist/history
 * 
 * Returns:
 * - Past sessions
 * - Total tracks played
 * - Average batch duration
 * - Removal statistics
 */
async function getLivePlaylistHistory(req, res) {
  try {
    const { venueId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    // Get all sessions for this venue
    const sessions = await LivePlaylistSession.find({
      venueId: venueId
    })
    .populate("tracks")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

    // Calculate stats
    const totalSessions = await LivePlaylistSession.countDocuments({
      venueId: venueId
    });

    const stats = {
      totalSessions: totalSessions,
      totalTracksAdded: sessions.reduce((sum, s) => sum + s.tracks.length, 0),
      totalTracksRemoved: sessions.reduce((sum, s) => sum + s.removedTrackIds.length, 0),
      averageBatchDurationMs: sessions.reduce((sum, s) => sum + (s.batchTotalDurationMs || 0), 0) / sessions.length || 0,
      activeBatches: sessions.filter(s => s.status === "active").length,
      completedBatches: sessions.filter(s => s.status === "stopped").length
    };

    return res.status(200).json({
      success: true,
      stats: stats,
      sessions: sessions.map(session => ({
        sessionId: session._id,
        status: session.status,
        batchId: session.batchId,
        trackCount: session.tracks.length,
        removedCount: session.removedTrackIds.length,
        batchDurationMs: session.batchTotalDurationMs,
        durationSec: Math.round((session.batchTotalDurationMs || 0) / 1000),
        startedAt: session.startedAt,
        stoppedAt: session.stoppedAt,
        duration: session.stoppedAt 
          ? Math.round((session.stoppedAt - session.startedAt) / 1000)
          : null
      }))
    });

  } catch (error) {
    console.error("Error getting live playlist history:", error);
    return res.status(500).json({
      error: "Failed to get live playlist history",
      message: error.message
    });
  }
}


// ============================================================================
// EXAMPLE 5: Add Route to Express App
// ============================================================================

/**
 * In your routes file (e.g., routes/venue.js)
 */

function setupLivePlaylistRoutes(app) {
  // Start live playlist
  app.post("/api/venue/:venueId/live-playlist/start", startLivePlaylist);

  // Stop live playlist
  app.post("/api/venue/:venueId/live-playlist/stop", stopLivePlaylist);

  // Get current status
  app.get("/api/venue/:venueId/live-playlist/status", getLivePlaylistStatus);

  // Get history and stats
  app.get("/api/venue/:venueId/live-playlist/history", getLivePlaylistHistory);
}

module.exports = {
  startLivePlaylist,
  stopLivePlaylist,
  getLivePlaylistStatus,
  getLivePlaylistHistory,
  setupLivePlaylistRoutes
};


// ============================================================================
// EXAMPLE 6: WebSocket Integration (Real-time Updates)
// ============================================================================

/**
 * Send real-time playlist updates via WebSocket
 */

function setupLivePlaylistWebSocket(io) {
  io.on("connection", (socket) => {
    // Client joins venue room
    socket.on("join-venue-live-playlist", (venueId) => {
      socket.join(`live-playlist:${venueId}`);
      console.log(`Client joined live playlist for venue: ${venueId}`);
    });

    // Client leaves venue room
    socket.on("leave-venue-live-playlist", (venueId) => {
      socket.leave(`live-playlist:${venueId}`);
      console.log(`Client left live playlist for venue: ${venueId}`);
    });
  });

  return {
    // Broadcast batch start
    broadcastBatchStart: (venueId, batchInfo) => {
      io.to(`live-playlist:${venueId}`).emit("batch-started", batchInfo);
    },

    // Broadcast duration calculated
    broadcastDurationCalculated: (venueId, durationInfo) => {
      io.to(`live-playlist:${venueId}`).emit("duration-calculated", durationInfo);
    },

    // Broadcast tracks removed
    broadcastTracksRemoved: (venueId, removalInfo) => {
      io.to(`live-playlist:${venueId}`).emit("tracks-removed", removalInfo);
    },

    // Broadcast batch completed
    broadcastBatchCompleted: (venueId, completionInfo) => {
      io.to(`live-playlist:${venueId}`).emit("batch-completed", completionInfo);
    }
  };
}


// ============================================================================
// EXAMPLE 7: Event Listeners and Hooks
// ============================================================================

/**
 * Hook into worker lifecycle for integrations
 */

const EventEmitter = require("events");
const workerEvents = new EventEmitter();

// When batch initializes
workerEvents.on("batch:init", (sessionId) => {
  console.log(`Batch initialized: ${sessionId}`);
  // TODO: Update venue UI, send notifications, etc.
});

// When duration calculated
workerEvents.on("batch:duration-calculated", (sessionId, durationMs) => {
  console.log(`Duration calculated for ${sessionId}: ${durationMs}ms`);
  // TODO: Update display, prepare UI, etc.
});

// When tracks removed
workerEvents.on("batch:tracks-removed", (sessionId, removedCount) => {
  console.log(`Removed ${removedCount} tracks from ${sessionId}`);
  // TODO: Update queue display, notifications, etc.
});

// When batch completed
workerEvents.on("batch:completed", (sessionId) => {
  console.log(`Batch completed: ${sessionId}`);
  // TODO: Trigger next batch animations, stats updates, etc.
});

module.exports = { workerEvents };


// ============================================================================
// API ENDPOINT USAGE EXAMPLES
// ============================================================================

/*

START LIVE PLAYLIST:
POST /api/venue/507f1f77bcf86cd799439011/live-playlist/start

Response:
{
  "success": true,
  "message": "Live playlist started",
  "session": {
    "sessionId": "507f1f77bcf86cd799439012",
    "venueId": "507f1f77bcf86cd799439011",
    "venueName": "The Blue Room",
    "status": "active",
    "startedAt": "2025-02-03T12:00:00Z"
  }
}


STOP LIVE PLAYLIST:
POST /api/venue/507f1f77bcf86cd799439011/live-playlist/stop

Response:
{
  "success": true,
  "message": "Live playlist stopped",
  "session": {
    "sessionId": "507f1f77bcf86cd799439012",
    "status": "stopped",
    "stoppedAt": "2025-02-03T12:30:00Z"
  }
}


GET STATUS:
GET /api/venue/507f1f77bcf86cd799439011/live-playlist/status

Response:
{
  "success": true,
  "session": {
    "sessionId": "507f1f77bcf86cd799439012",
    "status": "active",
    "active": true,
    "batchTotalDurationMs": 1000000,
    "fiftyPercentThresholdMs": 500000,
    "trackCount": 5,
    "tracks": [...]
  }
}


GET HISTORY:
GET /api/venue/507f1f77bcf86cd799439011/live-playlist/history?limit=10

Response:
{
  "success": true,
  "stats": {
    "totalSessions": 45,
    "totalTracksAdded": 225,
    "totalTracksRemoved": 135,
    "averageBatchDurationMs": 850000
  },
  "sessions": [...]
}

*/

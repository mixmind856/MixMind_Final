const { Worker } = require("bullmq");
const axios = require("axios");
const mongoose = require("mongoose");
const Request = require("../models/Request");

/* -------------------- UTILITY: SLEEP -------------------- */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/* -------------------- EXECUTE THREE-STEP REQUEST FLOW -------------------- */
async function executeThreeStepRequestFlow(songName, artistName) {
  try {
    console.log(`🎵 Processing song request: "${songName}" by "${artistName}"...`);
    
    const baseUrl = process.env.EXECUTE_API_URL || "http://127.0.0.1:80";
    
    // Pre-Step 1: Go to Online Music\Beatsource folder
    console.log(`📍 Pre-Step 1: Going to Online Music\\Beatsource folder...`);
    const goToFolderScript = `browser_gotofolder "Online Music\\Beatsource"`;
    const goToFolderUrl = `${baseUrl}/execute?script=${encodeURIComponent(goToFolderScript)}`;
    
    try {
      const goToFolderResponse = await axios.get(goToFolderUrl, { timeout: 5000 });
      console.log(`✓ Pre-Step 1 completed:`, goToFolderResponse.data);
    } catch (err) {
      console.error(`✗ Pre-Step 1 failed:`, err.message);
      throw new Error(`Go to folder failed: ${err.message}`);
    }
    
    // Pre-Step 2: Select songs window
    console.log(`📍 Pre-Step 2: Selecting songs window...`);
    const browserWindowScript = `browser_window "songs"`;
    const browserWindowUrl = `${baseUrl}/execute?script=${encodeURIComponent(browserWindowScript)}`;
    
    try {
      const browserWindowResponse = await axios.get(browserWindowUrl, { timeout: 5000 });
      console.log(`✓ Pre-Step 2 completed:`, browserWindowResponse.data);
    } catch (err) {
      console.error(`✗ Pre-Step 2 failed:`, err.message);
      throw new Error(`Browser window selection failed: ${err.message}`);
    }
    
    // Step 1: Search for the song
    console.log(`📍 Step 1: Searching for song...`);
    const searchScript = `search "${songName}"`;
    const searchUrl = `${baseUrl}/execute?script=${encodeURIComponent(searchScript)}`;
    
    try {
      const searchResponse = await axios.get(searchUrl, { timeout: 5000 });
      console.log(`✓ Search step completed:`, searchResponse.data);
    } catch (searchErr) {
      console.error(`✗ Search step failed:`, searchErr.message);
      throw new Error(`Search step failed: ${searchErr.message}`);
    }
    
    // Wait 1000ms between search and select
    await sleep(1000);
    
    // Step 2: Select/Focus and Scroll
    console.log(`📍 Step 2: Selecting and scrolling...`);
    const selectScript = `browser_focus & browser_scroll +1`;
    const selectUrl = `${baseUrl}/execute?script=${encodeURIComponent(selectScript)}`;
    
    try {
      const selectResponse = await axios.get(selectUrl, { timeout: 5000 });
      console.log(`✓ Select step completed:`, selectResponse.data);
    } catch (selectErr) {
      console.error(`✗ Select step failed:`, selectErr.message);
      throw new Error(`Select step failed: ${selectErr.message}`);
    }
    
    // Wait 1000ms between select and add
    await sleep(1000);
    
    // Step 3: Add to playlist
    console.log(`📍 Step 3: Adding to playlist...`);
    const addScript = `playlist_add`;
    const addUrl = `${baseUrl}/execute?script=${encodeURIComponent(addScript)}`;
    
    try {
      const addResponse = await axios.get(addUrl, { timeout: 5000 });
      console.log(`✓ Add step completed:`, addResponse.data);
    } catch (addErr) {
      console.error(`✗ Add step failed:`, addErr.message);
      throw new Error(`Add step failed: ${addErr.message}`);
    }
    
    console.log(`✅ All three steps completed successfully!`);
    return {
      success: true,
      message: "Three-step song request flow completed successfully",
      songName,
      artistName
    };
    
  } catch (err) {
    console.error(`❌ Three-step flow error:`, err.message);
    return {
      success: false,
      error: err.message,
      songName,
      artistName
    };
  }
}

/* -------------------- SONG REQUEST WORKER -------------------- */
const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379
};

// Initialize worker with MongoDB connection
let worker;

async function initializeWorker() {
  // Ensure MongoDB is connected
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("✅ MongoDB connected for Song Request Worker");
    } catch (err) {
      console.error("❌ Failed to connect MongoDB for Song Request Worker:", err.message);
      setTimeout(initializeWorker, 5000); // Retry in 5 seconds
      return;
    }
  }

  worker = new Worker(
  "song-requests",
  async (job) => {
    try {
      const { requestId, songName, artistName } = job.data;
      
      // Configurable delay before processing (default: 5 seconds)
      const queueDelayMs = Number(process.env.QUEUE_PROCESS_DELAY_MS) || 5000;
      
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🎵 JOB #${job.id} QUEUED`);
      console.log(`${'='.repeat(70)}`);
      console.log(`📌 Request ID: ${requestId}`);
      console.log(`🎵 Song: "${songName}" by "${artistName}"`);
      console.log(`⏳ Waiting ${queueDelayMs / 1000}s before processing...`);
      
      // Wait before processing
      await sleep(queueDelayMs);
      
      console.log(`\n${'='.repeat(70)}`);
      console.log(`🎵 JOB #${job.id} PROCESSING`);
      console.log(`${'='.repeat(70)}`);
      console.log(`📌 Request ID: ${requestId}`);
      console.log(`🎵 Song: "${songName}" by "${artistName}"`);
      
        // Update request status to "processing"
        await Request.findByIdAndUpdate(requestId, { 
          status: "processing",
          flowStatus: "in_progress"
        });
        
        // Execute the three-step flow
        const flowResult = await executeThreeStepRequestFlow(songName, artistName);
        
        // Update request based on result
        if (flowResult.success) {
          await Request.findByIdAndUpdate(requestId, { 
            status: "completed",
            flowStatus: "completed"
          });
          console.log(`✅ Job #${job.id} COMPLETED successfully`);
        } else {
          await Request.findByIdAndUpdate(requestId, { 
            status: "failed",
            flowStatus: "failed",
            flowError: flowResult.error
          });
          console.log(`❌ Job #${job.id} FAILED: ${flowResult.error}`);
          throw new Error(flowResult.error);
        }
        
        console.log(`${'='.repeat(70)}\n`);
        return flowResult;
        
      } catch (err) {
        console.error(`❌ Worker error for job ${job.id}:`, err.message);
        
        // Update request with error
        if (job.data.requestId) {
          await Request.findByIdAndUpdate(job.data.requestId, { 
            status: "failed",
            flowStatus: "failed",
            flowError: err.message
          }).catch(e => console.error("Error updating request:", e));
        }
        
        throw err;
      }
    },
    { 
      connection,
      concurrency: 1, // Process only 1 request at a time
      settings: {
        maxStalledCount: 2,
        stalledInterval: 30000,
        maxStalledCount: 2,
        lockDuration: 30000,
        lockRenewTime: 15000
      }
    }
  );

  /* -------------------- WORKER EVENT HANDLERS -------------------- */
  worker.on("completed", (job, result) => {
    console.log(`✅ Job ${job.id} completed:`, result);
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Job ${job.id} failed:`, err.message);
  });

  worker.on("error", (err) => {
    console.error(`❌ Worker error:`, err.message);
  });

  console.log("🚀 Song Request Worker initialized (concurrency: 1)");
}

// Initialize the worker immediately
initializeWorker().catch(err => console.error("Worker initialization error:", err));

module.exports = (() => {
  // Return a getter that provides the worker once it's initialized
  return {
    get instance() {
      return worker;
    },
    initialized: () => !!worker
  };
})();

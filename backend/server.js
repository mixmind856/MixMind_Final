require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");
const workerManager = require("./worker/workerManager");

const app = express();
const PORT = process.env.PORT || 4000;

// -------------------- CORS --------------------
app.use(
  cors({
    origin: process.env.CLIENT_URL, // e.g., "http://localhost:3000"
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "x-admin-key", "Authorization"]
  })
);

// -------------------- BODY PARSERS --------------------
// Normal JSON parser for all routes except Stripe webhook
app.use(express.json());

// -------------------- ROUTES --------------------
app.use("/api/admin", require("./api/admin"));
app.use("/api/requests", require("./api/requests"));
app.use("/api/payments", require("./api/payment"));
app.use("/api/stripe", require("./api/stripe")); // webhook route
app.use("/api/venue", require("./routes/venue")); // venue auth routes
app.use("/api/dj", require("./api/dj")); // DJ mode routes

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// -------------------- DATABASE & SERVER --------------------
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`API server running on port ${PORT}`);
      
      // Auto-start beatsource queue worker (always needed to process requests)
      // Live playlist worker only starts when a venue toggles it ON
      setTimeout(async () => {
        try {
          const Venue = require("./models/Venue");
          
          // Start beatsource queue worker (processes approved requests)
          console.log("🚀 Starting Beatsource Queue Worker...");
          workerManager.startBeatsourceWorker();
          console.log("✅ Beatsource Queue Worker started");
          
          // Start song request queue worker (processes queued song requests sequentially)
          console.log("🚀 Starting Song Request Queue Worker...");
          const songRequestWorkerModule = require("./queues/songRequestWorker");
          let waitCount = 0;
          while (!songRequestWorkerModule.initialized() && waitCount < 30) {
            await new Promise(resolve => setTimeout(resolve, 100));
            waitCount++;
          }
          if (songRequestWorkerModule.initialized()) {
            console.log("✅ Song Request Queue Worker started (processing 1 request at a time)");
          } else {
            console.error("⚠️  Song Request Queue Worker initialization timeout");
          }
          
          // Check if any venue has live playlist active
          const activeVenue = await Venue.findOne({ livePlaylistActive: true });
          if (activeVenue) {
            console.log(`🎵 Live Playlist active for ${activeVenue.name}, starting rotation worker...`);
            workerManager.startLivePlaylist(activeVenue._id.toString());
            console.log("✅ Live Playlist Worker started");
          } else {
            console.log("📭 No active venues - Live Playlist Worker idle (toggle ON to start)");
          }
        } catch (err) {
          console.error("Worker startup error:", err.message);
        }
      }, 2000);
    });
  })
  .catch((err) => {
    console.error("Failed to connect DB", err);
    process.exit(1);
  });

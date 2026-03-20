const Venue = require("../../models/Venue");
const Request = require("../../models/Request");
const songRequestQueue = require("../../queues/songRequestQueue");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/* -------------------- INITIALIZE DJ MODE -------------------- */
async function initializeDJMode(req, res) {
  try {
    const { venueId } = req.params;
    const { djPassword } = req.body;

    if (!djPassword) {
      return res.status(400).json({ error: "DJ password is required" });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Hash DJ password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(djPassword, salt);

    venue.djMode = true;
    venue.djPassword = hashedPassword;
    await venue.save();

    res.json({
      message: "DJ mode initialized successfully",
      djMode: venue.djMode
    });
  } catch (err) {
    console.error("Initialize DJ mode error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- DJ LOGIN -------------------- */
async function djLogin(req, res) {
  try {
    const { venueId, djPassword } = req.body;

    if (!venueId || !djPassword) {
      return res.status(400).json({ error: "Venue ID and password are required" });
    }

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    if (!venue.djMode) {
      return res.status(400).json({ error: "DJ mode is not enabled for this venue" });
    }

    // Verify DJ password
    const isMatch = await bcrypt.compare(djPassword, venue.djPassword);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid DJ password" });
    }

    // Generate DJ token (JWT)
    const djToken = jwt.sign(
      { venueId: venue._id, venueName: venue.name, role: "dj" },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    res.json({
      djToken,
      venueId: venue._id,
      venueName: venue.name,
      message: "DJ login successful"
    });
  } catch (err) {
    console.error("DJ login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- TOGGLE DJ MODE -------------------- */
async function toggleDJMode(req, res) {
  try {
    const { venueId } = req.params;
    const { djPassword } = req.body;

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // If disabling DJ mode, don't require password
    // If enabling, require password setup
    if (!venue.djMode) {
      if (!djPassword) {
        return res.status(400).json({ error: "DJ password required to enable DJ mode" });
      }
      const salt = await bcrypt.genSalt(10);
      venue.djPassword = await bcrypt.hash(djPassword, salt);
    }

    venue.djMode = !venue.djMode;
    await venue.save();

    res.json({
      djMode: venue.djMode,
      message: `DJ mode ${venue.djMode ? "enabled" : "disabled"} successfully`
    });
  } catch (err) {
    console.error("Toggle DJ mode error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- GET PENDING REQUESTS FOR DJ -------------------- */
async function getPendingRequests(req, res) {
  try {
    const { venueId } = req.params;

    const requests = await Request.find({
      venueId: venueId,
      status: "pending_dj_approval"
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Get pending requests error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- DJ ACCEPT REQUEST -------------------- */
async function djAcceptRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { venueId } = req.body;

    const request = await Request.findById(requestId).populate("userId");
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify venue authorization
    if (request.venueId.toString() !== venueId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update status to approved and record DJ approval
    request.status = "queued";
    request.djApprovedAt = new Date();
    await request.save();

    // Add the approved request to the song request queue for processing
    try {
      const job = await songRequestQueue.add(
        "process-song-request",
        {
          requestId: request._id.toString(),
          songName: request.title,
          artistName: request.artist
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

      console.log(`✅ DJ APPROVED - Queued song request - Job ID: ${job.id}, Request ID: ${request._id}`);

      res.json({
        message: "Request approved and queued for processing",
        requestId: request._id,
        jobId: job.id,
        status: request.status
      });
    } catch (queueErr) {
      console.error("Error queuing approved request:", queueErr);
      res.status(500).json({ 
        error: "Failed to queue approved request",
        requestId: request._id 
      });
    }
  } catch (err) {
    console.error("DJ accept request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- DJ REJECT REQUEST -------------------- */
async function djRejectRequest(req, res) {
  try {
    const { requestId } = req.params;
    const { venueId, reason } = req.body;

    const request = await Request.findById(requestId);
    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    // Verify venue authorization
    if (request.venueId.toString() !== venueId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Update status and record DJ rejection
    request.status = "rejected";
    request.djRejectedAt = new Date();
    request.djRejectionReason = reason || "Rejected by DJ";
    await request.save();

    console.log(`❌ DJ REJECTED - Request ID: ${request._id}, Reason: ${request.djRejectionReason}`);

    res.json({
      message: "Request rejected",
      requestId: request._id,
      status: request.status,
      rejectionReason: request.djRejectionReason
    });
  } catch (err) {
    console.error("DJ reject request error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

/* -------------------- GET DJ STATS -------------------- */
async function getDJStats(req, res) {
  try {
    const { venueId } = req.params;

    const requests = await Request.find({ venueId });

    const stats = {
      total: requests.length,
      pendingDJApproval: requests.filter(r => r.status === "pending_dj_approval").length,
      accepted: requests.filter(r => r.status === "completed").length,
      rejected: requests.filter(r => r.status === "rejected").length,
      totalRevenue: requests.reduce((sum, r) => sum + (r.price || 0), 0)
    };

    res.json(stats);
  } catch (err) {
    console.error("Get DJ stats error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  initializeDJMode,
  djLogin,
  toggleDJMode,
  getPendingRequests,
  djAcceptRequest,
  djRejectRequest,
  getDJStats
};

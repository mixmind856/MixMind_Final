const express = require("express");
const User = require("../models/User");
const Request = require("../models/Request");
const verifyVenueToken = require("../middleware/verifyVenueToken");

const router = express.Router();

/**
 * POST /api/requests
 * Creates a request ONLY (no payment here)
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, title, artist, price, venueId } = req.body;

    if (!name || !email || !title || !artist || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({
        name,
        email,
        role: "user"
      });
    }

    const request = await Request.create({
      userId: user._id,
      venueId: venueId || null,
      title,
      artist,
      price,
      status: "created"
    });

    res.json({
      requestId: request._id,
      status: request.status
    });
  } catch (err) {
    console.error("Create request error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/requests/:id
 */
router.get("/:id", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id).populate("userId");
    if (!request) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(request);
  } catch (err) {
    console.error("Get request error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * GET /api/requests/venue/:venueId
 * Get all requests for a specific venue
 */
router.get("/venue/:venueId", verifyVenueToken, async (req, res) => {
  try {
    const { venueId } = req.params;

    // Verify that the requesting venue matches the requested venueId
    if (req.venue.id !== venueId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const requests = await Request.find({ venueId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Get venue requests error", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;

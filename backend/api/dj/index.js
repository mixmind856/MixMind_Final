const express = require("express");
const djController = require("./dj.controller");
const verifyVenueToken = require("../../middleware/verifyVenueToken");

const router = express.Router();

/**
 * POST /api/dj/initialize/:venueId
 * Initialize DJ mode for a venue (set DJ password)
 */
router.post("/initialize/:venueId", verifyVenueToken, djController.initializeDJMode);

/**
 * POST /api/dj/login
 * DJ login endpoint
 */
router.post("/login", djController.djLogin);

/**
 * POST /api/dj/toggle/:venueId
 * Toggle DJ mode on/off
 */
router.post("/toggle/:venueId", verifyVenueToken, djController.toggleDJMode);

/**
 * GET /api/dj/requests/:venueId
 * Get pending requests for DJ
 */
router.get("/requests/:venueId", djController.getPendingRequests);

/**
 * POST /api/dj/requests/:requestId/accept
 * DJ accepts a request
 */
router.post("/requests/:requestId/accept", djController.djAcceptRequest);

/**
 * POST /api/dj/requests/:requestId/reject
 * DJ rejects a request
 */
router.post("/requests/:requestId/reject", djController.djRejectRequest);

/**
 * GET /api/dj/stats/:venueId
 * Get DJ statistics
 */
router.get("/stats/:venueId", djController.getDJStats);

module.exports = router;

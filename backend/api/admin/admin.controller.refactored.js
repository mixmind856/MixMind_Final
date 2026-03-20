/**
 * Admin Controller
 * Routes admin API calls to appropriate service layers
 * Handles HTTP requests/responses and error handling
 *
 * Structure:
 * - Request Management: list, approve, reject requests
 * - Payment Management: track payment status
 * - Revenue Management: revenue reporting
 * - Live Playlist Management: enable/disable live playlist
 */

const {
  paymentService,
  requestService,
  revenueService,
  livePlaylistService
} = require("../../services");

/* ============================================================
   REQUEST MANAGEMENT HANDLERS
   ============================================================ */

/**
 * List all requests (admin view)
 * GET /admin/requests
 * Query params: status, venueId
 */
async function listRequestsHandler(req, res) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.venueId) filter.venueId = req.query.venueId;

    const requests = await requestService.listRequests(filter);
    res.json(requests);
  } catch (err) {
    console.error("❌ List Requests Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * List requests for a specific venue
 * GET /admin/requests/venue/:venueId
 * Query params: status
 */
async function listVenueRequestsHandler(req, res) {
  try {
    const { venueId } = req.params;
    const filter = req.query.status ? { status: req.query.status } : {};

    const requests = await requestService.listVenueRequests(venueId, filter);
    res.json(requests);
  } catch (err) {
    console.error("❌ List Venue Requests Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Approve a request and capture payment
 * POST /admin/requests/:id/approve
 * Body: (optional) reason
 */
async function approveRequestHandler(req, res) {
  try {
    const requestId = req.params.id;
    const result = await requestService.approveRequest(requestId);
    res.json(result);
  } catch (err) {
    console.error("❌ Approve Request Error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

/**
 * Reject a request and release payment
 * POST /admin/requests/:id/reject
 * Body: { reason: string }
 */
async function rejectRequestHandler(req, res) {
  try {
    const requestId = req.params.id;
    const { reason } = req.body;

    const result = await requestService.rejectRequest(requestId, reason);
    res.json(result);
  } catch (err) {
    console.error("❌ Reject Request Error:", err.message);
    res.status(400).json({ error: err.message });
  }
}

/* ============================================================
   PAYMENT MANAGEMENT HANDLERS
   ============================================================ */

/**
 * Get payment status with complete lifecycle information
 * GET /admin/payments/:requestId/status
 */
async function getPaymentStatusHandler(req, res) {
  try {
    const { requestId } = req.params;
    const paymentStatus = await paymentService.getPaymentStatus(requestId);
    res.json(paymentStatus);
  } catch (err) {
    console.error("❌ Payment Status Error:", err.message);
    res.status(404).json({ error: err.message });
  }
}

/* ============================================================
   REVENUE MANAGEMENT HANDLERS
   ============================================================ */

/**
 * Get complete revenue data for a venue
 * GET /admin/revenue/venue/:venueId
 * Returns: breakdown by payment status (captured, authorized, failed)
 */
async function getVenueRevenueHandler(req, res) {
  try {
    const { venueId } = req.params;
    const revenueData = await revenueService.getVenueRevenue(venueId);
    res.json(revenueData);
  } catch (err) {
    console.error("❌ Revenue Error:", err.message);
    res.status(404).json({ error: err.message });
  }
}

/**
 * Get revenue summary for a venue
 * GET /admin/revenue/venue/:venueId/summary
 * Returns: quick statistics (total, count, average)
 */
async function getRevenueSummaryHandler(req, res) {
  try {
    const { venueId } = req.params;
    const summary = await revenueService.getRevenueSummary(venueId);
    res.json(summary);
  } catch (err) {
    console.error("❌ Revenue Summary Error:", err.message);
    res.status(404).json({ error: err.message });
  }
}

/* ============================================================
   LIVE PLAYLIST MANAGEMENT HANDLERS
   ============================================================ */

/**
 * Get live playlist status
 * GET /admin/live-playlist/status
 */
async function getLivePlaylistStatusHandler(req, res) {
  try {
    const status = await livePlaylistService.getLivePlaylistStatus();
    res.json(status);
  } catch (err) {
    console.error("❌ Live Playlist Status Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Start live playlist
 * POST /admin/live-playlist/start
 */
async function startLivePlaylistHandler(req, res) {
  try {
    const result = await livePlaylistService.startLivePlaylist();
    res.json(result);
  } catch (err) {
    console.error("❌ Start Live Playlist Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Stop live playlist
 * POST /admin/live-playlist/stop
 */
async function stopLivePlaylistHandler(req, res) {
  try {
    const result = await livePlaylistService.stopLivePlaylist();
    res.json(result);
  } catch (err) {
    console.error("❌ Stop Live Playlist Error:", err.message);
    res.status(500).json({ error: err.message });
  }
}

/* ============================================================
   EXPORTS
   ============================================================ */

module.exports = {
  // Request management
  listRequestsHandler,
  listVenueRequestsHandler,
  approveRequestHandler,
  rejectRequestHandler,

  // Payment management
  getPaymentStatusHandler,

  // Revenue management
  getVenueRevenueHandler,
  getRevenueSummaryHandler,

  // Live playlist management
  getLivePlaylistStatusHandler,
  startLivePlaylistHandler,
  stopLivePlaylistHandler,

  // For backward compatibility, export service functions as well
  capturePaymentAndUpdateRevenue: paymentService.capturePaymentAndUpdateRevenue,
  releasePaymentAndUpdateRevenue: paymentService.releasePaymentAndUpdateRevenue
};

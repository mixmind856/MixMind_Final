const express = require("express");
const { handleWebhook } = require("./stripe.controller");

const router = express.Router();

// Stripe requires raw body for signature verification
router.post("/webhook", express.raw({ type: "application/json" }), handleWebhook);

module.exports = router;

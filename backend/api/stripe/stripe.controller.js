const Stripe = require("stripe");
const Payment = require("../../models/Payment");
const Request = require("../../models/Request");
const Venue = require("../../models/Venue");

const DEMO_MODE = process.env.DEMO_MODE === "true" || !process.env.STRIPE_SECRET_KEY;
const stripe = !DEMO_MODE ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
}) : null;

async function handleWebhook(req, res) {
  // In demo mode, skip webhook signature validation
  if (DEMO_MODE) {
    console.log("🎪 Demo mode: Skipping Stripe webhook validation");
    return res.json({ received: true });
  }

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Stripe signature error:", err.message);
    return res.status(400).send("Invalid signature");
  }

  try {
    const obj = event.data.object;

    if (event.type === "payment_intent.amount_capturable_updated") {
      const requestId = obj.metadata?.requestId;
      const venueId = obj.metadata?.venueId;
      
      if (!requestId) return res.json({ received: true });

      console.log(`\n💳 [WEBHOOK] Payment Authorized: ${obj.id}`);

      // Update Payment record
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: obj.id },
        { 
          status: "authorized", 
          authorizedAt: new Date(),
          amount: obj.amount / 100,
          lastStripeEventId: event.id, 
          rawWebhook: obj 
        },
        { new: true }
      );
      
      // Update Request
      await Request.findByIdAndUpdate(requestId, { 
        paymentStatus: "authorized",
        paymentIntentId: obj.id
      });

      // Update Venue authorized amount
      if (venueId) {
        const venue = await Venue.findByIdAndUpdate(
          venueId,
          { 
            $inc: { totalAuthorizedAmount: obj.amount / 100 },
            lastRevenueUpdateAt: new Date()
          },
          { new: true }
        );
        console.log(`✅ Venue authorized updated: $${obj.amount / 100}, Total authorized: $${venue.totalAuthorizedAmount}`);
      }

      console.log(`✅ Payment authorized: ${requestId}`);
    }

    if (event.type === "payment_intent.succeeded") {
      const requestId = obj.metadata?.requestId;
      
      if (!requestId) return res.json({ received: true });

      console.log(`\n💰 [WEBHOOK] Payment Captured: ${obj.id}`);

      // Update Payment record - Note: Webhook may not trigger capture, use admin flow instead
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: obj.id },
        { 
          status: "captured", 
          capturedAt: new Date(),
          capturedAmount: obj.amount / 100,
          lastStripeEventId: event.id, 
          rawWebhook: obj 
        },
        { new: true }
      );
      
      // Update Request
      await Request.findByIdAndUpdate(requestId, { 
        paymentStatus: "captured",
        paidAmount: obj.amount / 100,
        paidAt: new Date(),
        paymentIntentId: obj.id
      });

      console.log(`✅ Payment captured: ${requestId}`);
    }

    if (
      event.type === "payment_intent.payment_failed" ||
      event.type === "payment_intent.canceled"
    ) {
      const requestId = obj.metadata?.requestId;
      const venueId = obj.metadata?.venueId;

      console.log(`\n🚫 [WEBHOOK] Payment ${event.type}: ${obj.id}`);

      // Update Payment record
      await Payment.findOneAndUpdate(
        { stripePaymentIntentId: obj.id },
        { 
          status: "failed", 
          failedAt: new Date(),
          lastStripeEventId: event.id, 
          rawWebhook: obj 
        },
        { new: true }
      );
      
      if (requestId) {
        await Request.findByIdAndUpdate(requestId, { 
          paymentStatus: "failed",
          paymentIntentId: obj.id
        });
      }

      // Update Venue authorized amount (remove it if payment was authorized)
      if (venueId && obj.amount) {
        const venue = await Venue.findByIdAndUpdate(
          venueId,
          { 
            $inc: { totalAuthorizedAmount: -(obj.amount / 100) },
            lastRevenueUpdateAt: new Date()
          },
          { new: true }
        );
        console.log(`✅ Venue authorized amount reduced: $${obj.amount / 100}, Remaining: $${venue.totalAuthorizedAmount}`);
      }

      console.log(`❌ Payment failed/released: ${requestId}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`❌ Webhook error: ${err.message}`);
    res.status(500).send("Webhook error");
  }
}

module.exports = { handleWebhook };

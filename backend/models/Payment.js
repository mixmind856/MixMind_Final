const { Schema, model } = require("mongoose");

const PaymentSchema = new Schema(
  {
    requestId: {
      type: Schema.Types.ObjectId,
      ref: "Request",
      required: true
    },

    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue"
    },

    stripePaymentIntentId: {
      type: String,
      required: true,
      index: true
    },

    amount: Number,
    capturedAmount: { type: Number, default: 0 }, // Amount actually charged
    currency: String,

    status: {
      type: String,
      enum: [
        "pending",       // created
        "authorized",    // funds held
        "captured",      // charged
        "cancelled",     // released
        "failed"
      ],
      default: "pending"
    },

    // Payment lifecycle timestamps
    authorizedAt: { type: Date },
    capturedAt: { type: Date },
    cancelledAt: { type: Date },
    failedAt: { type: Date },

    lastStripeEventId: String,
    rawWebhook: Object,
    
    // Payment notes
    paymentNotes: { type: String },
    errorMessage: { type: String }
  },
  { timestamps: true }
);

module.exports = model("Payment", PaymentSchema);

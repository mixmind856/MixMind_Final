const { Schema, model } = require("mongoose");
const bcrypt = require("bcryptjs");

const VenueSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String },
    websiteUrl: { type: String },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    verificationToken: { type: String },
    verificationTokenExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
    livePlaylistActive: { type: Boolean, default: false },
    
    // DJ Mode
    djMode: { type: Boolean, default: false },
    djPassword: { type: String },
    
    // Preferred genres for automix (when DJ mode is OFF)
    preferredGenres: { type: [String], default: [] },
    
    // Revenue tracking - ONLY captured payments count
    totalRevenue: { type: Number, default: 0 },
    totalCapturedPayments: { type: Number, default: 0 },
    totalAuthorizedAmount: { type: Number, default: 0 },
    lastRevenueUpdateAt: { type: Date }
  },
  { timestamps: true }
);

// Hash password before saving
VenueSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (err) {
    throw err;
  }
});

// Method to compare passwords
VenueSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = model("Venue", VenueSchema);

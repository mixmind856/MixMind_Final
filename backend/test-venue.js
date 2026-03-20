const mongoose = require("mongoose");
const Venue = require("./models/Venue");

async function test() {
  try {
    await mongoose.connect("mongodb://localhost:27017/djrequests");
    console.log("Connected to MongoDB");

    // Try to create a venue
    const venue = new Venue({
      name: "Test Venue",
      email: "test@venue.com",
      password: "test123",
      phone: "1234567890"
    });

    console.log("Venue object created");
    console.log("About to save...");

    await venue.save();

    console.log("Venue saved successfully!");
    console.log(venue);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
}

test();

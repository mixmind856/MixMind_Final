const jwt = require("jsonwebtoken");
const Venue = require("../../models/Venue");

/**
 * Generate JWT token for venue
 */
function generateToken(venueId) {
  return jwt.sign({ id: venueId }, process.env.JWT_SECRET || "your_jwt_secret_key", {
    expiresIn: "7d"
  });
}

/**
 * Sign up a new venue
 */
async function venueSignup(req, res) {
  try {
    const { name, email, password, phone, address, city, state, zipCode, country, websiteUrl, description } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    // Check if venue already exists
    const existingVenue = await Venue.findOne({ email: email.toLowerCase() });
    if (existingVenue) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create new venue
    const venue = new Venue({
      name,
      email: email.toLowerCase(),
      password,
      phone,
      address,
      city,
      state,
      zipCode,
      country,
      websiteUrl,
      description,
      isVerified: true // Auto-verify for testing
    });

    await venue.save();

    // Generate token
    const token = generateToken(venue._id);

    res.status(201).json({
      message: "Venue registered successfully",
      token,
      venue: {
        id: venue._id,
        name: venue.name,
        email: venue.email,
        phone: venue.phone
      }
    });
  } catch (err) {
    console.error("Venue Signup Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Sign in a venue
 */
async function venueSignin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find venue
    const venue = await Venue.findOne({ email: email.toLowerCase() });
    if (!venue) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isPasswordValid = await venue.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if venue is active
    if (!venue.isActive) {
      return res.status(403).json({ error: "Venue account is inactive" });
    }

    // Generate token
    const token = generateToken(venue._id);

    res.json({
      message: "Signed in successfully",
      token,
      venue: {
        id: venue._id,
        name: venue.name,
        email: venue.email,
        phone: venue.phone,
        city: venue.city
      }
    });
  } catch (err) {
    console.error("Venue Signin Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get venue profile
 */
async function getVenueProfile(req, res) {
  try {
    const venueId = req.venue.id;
    const venue = await Venue.findById(venueId).select("-password");

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json(venue);
  } catch (err) {
    console.error("Get Venue Profile Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Update venue profile
 */
async function updateVenueProfile(req, res) {
  try {
    const venueId = req.venue.id;
    const { name, phone, address, city, state, zipCode, country, websiteUrl, description, preferredGenres } = req.body;

    const updateData = { name, phone, address, city, state, zipCode, country, websiteUrl, description };
    
    // If preferredGenres is provided, add it to update
    if (preferredGenres) {
      updateData.preferredGenres = Array.isArray(preferredGenres) ? preferredGenres : [preferredGenres];
    }

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      updateData,
      { new: true }
    ).select("-password");

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json({ message: "Profile updated successfully", venue });
  } catch (err) {
    console.error("Update Venue Profile Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get public venue info (no authentication required)
 */
async function getPublicVenue(req, res) {
  try {
    const { venueId } = req.params;

    const venue = await Venue.findById(venueId)
      .select("-password -verificationToken -verificationTokenExpiry");

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json(venue);
  } catch (err) {
    console.error("Get Public Venue Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Toggle live playlist
 */
async function toggleLivePlaylist(req, res) {
  try {
    const venueId = req.venue.id;
    const { active } = req.body;

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      { livePlaylistActive: active },
      { new: true }
    ).select("-password");

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    // Control worker lifecycle
    const workerManager = require("../../worker/workerManager");
    
    try {
      if (active) {
        console.log(`🎛️  Starting rotation worker for venue ${venue.name} (ID: ${venueId})`);
        const result = workerManager.startLivePlaylist(venueId.toString());
        
        if (result.started) {
          console.log(`✅ Worker started with PID: ${result.pid}`);
          res.json({
            message: "✅ Live playlist rotation started",
            active: true,
            venue,
            worker: result
          });
        } else {
          console.warn(`⚠️  Worker start returned: ${result.message || JSON.stringify(result)}`);
          res.json({
            message: result.message || "Status updated",
            active: true,
            venue,
            worker: result
          });
        }
      } else {
        console.log(`⏹️  Stopping rotation worker for venue ${venue.name}`);
        workerManager.stopLivePlaylist();
        res.json({
          message: "Live playlist rotation stopped",
          active: false,
          venue
        });
      }
    } catch (workerErr) {
      console.error(`Worker control error:`, workerErr.message);
      res.json({
        message: "Status updated but worker control failed",
        active,
        venue,
        warning: workerErr.message
      });
    }
  } catch (err) {
    console.error("Toggle Live Playlist Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Toggle venue active status (online/offline)
 */
async function toggleVenueStatus(req, res) {
  try {
    const venueId = req.venue.id;
    const { active } = req.body;

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      { isActive: active },
      { new: true }
    ).select("-password");

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json({
      message: active ? "Venue is now ONLINE" : "Venue is now OFFLINE",
      isActive: active,
      venue
    });
  } catch (err) {
    console.error("Toggle Venue Status Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get all active venues
 */
async function getActiveVenues(req, res) {
  try {
    const venues = await Venue.find({ isActive: true })
      .select("-password -verificationToken -verificationTokenExpiry -totalAuthorizedAmount")
      .sort({ name: 1 });

    res.json(venues);
  } catch (err) {
    console.error("Get Active Venues Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Set preferred genres for automix (genre filtering)
 */
async function setPreferredGenres(req, res) {
  try {
    const venueId = req.venue.id;
    const { preferredGenres } = req.body;

    if (!Array.isArray(preferredGenres)) {
      return res.status(400).json({ error: "preferredGenres must be an array" });
    }

    if (preferredGenres.length === 0) {
      return res.status(400).json({ error: "At least one genre must be provided" });
    }

    const venue = await Venue.findByIdAndUpdate(
      venueId,
      { preferredGenres },
      { new: true }
    ).select("-password");

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    console.log(`✅ Preferred genres updated for venue ${venue.name}: ${preferredGenres.join(", ")}`);

    res.json({ 
      message: "Preferred genres updated successfully",
      preferredGenres: venue.preferredGenres
    });
  } catch (err) {
    console.error("Set Preferred Genres Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Get preferred genres for a venue
 */
async function getPreferredGenres(req, res) {
  try {
    const venueId = req.venue.id;

    const venue = await Venue.findById(venueId).select("preferredGenres");

    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }

    res.json({ 
      preferredGenres: venue.preferredGenres || [],
      message: venue.preferredGenres.length > 0 
        ? `Venue accepts: ${venue.preferredGenres.join(", ")}`
        : "No genre restrictions - all genres accepted"
    });
  } catch (err) {
    console.error("Get Preferred Genres Error:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  venueSignup,
  venueSignin,
  getVenueProfile,
  updateVenueProfile,
  getPublicVenue,
  toggleLivePlaylist,
  toggleVenueStatus,
  getActiveVenues,
  setPreferredGenres,
  getPreferredGenres
};

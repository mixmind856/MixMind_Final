const nodemailer = require("nodemailer");
const Venue = require("../models/Venue");

/**
 * Email Service for sending DJ decision notifications
 */

// Create transporter
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === "gmail") {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });
  } else if (process.env.EMAIL_SERVICE === "sendgrid") {
    return nodemailer.createTransport({
      host: "smtp.sendgrid.net",
      port: 587,
      auth: {
        user: "apikey",
        pass: process.env.SENDGRID_API_KEY
      }
    });
  } else {
    return nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASSWORD
      }
    });
  }
};

// Exact CSS match from your provided HTML
const EMAIL_HEAD = `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Outfit', sans-serif; background-color: #07070B; -webkit-font-smoothing: antialiased; }
    
    .font-display { font-family: 'Space Grotesk', sans-serif; }
    
    .glow-button {
      background: linear-gradient(135deg, #A855F7 0%, #7C3AED 100%);
      box-shadow: 0 8px 50px rgba(168,85,247,0.6), 0 0 80px rgba(168,85,247,0.3), 0 4px 20px rgba(0,0,0,0.3);
      transition: all 0.4s cubic-bezier(0.34,1.56,0.64,1);
    }
    
    .secondary-button {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.08);
      transition: all 0.2s;
    }
  </style>
`;

/**
 * Send email when DJ accepts a request
 */
async function sendDJAcceptanceEmail(request, venue) {
  try {
    const user = request.userId;
    const songTitle = request.title || request.songTitle;
    const artistName = request.artist || request.artistName;
    const venueId = request.venueId || venue?._id || "";
    const FRONTEND_URL = process.env.FRONTEND_URL || "https://mixmind.app";
    const REQUEST_PAGE_URL = `${FRONTEND_URL}/venue-request/${venueId}`;

    console.log(`📧 Preparing DJ ACCEPTANCE email for: ${user.email}`);

    const mailOptions = {
      from: process.env.GMAIL_USER || "noreply@mixmind.com",
      to: user.email,
      subject: "🎵 Your Song Request Was Approved! - MixMind",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${EMAIL_HEAD}</head>
        <body style="background-color: #07070B; padding: 40px 20px;">
          <div style="max-width: 450px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, rgba(18,18,34,0.92) 0%, rgba(18,18,34,0.55) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px;">
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(34,227,161,0.2); box-shadow: 0 0 30px rgba(34,227,161,0.3); line-height: 64px; text-align: center;">
                      <img src="https://img.icons8.com/ios-filled/50/22E3A1/checkmark--v1.png" width="32" height="32" style="vertical-align: middle;" alt="Success"/>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h1 class="font-display" style="font-size: 30px; font-weight: 700; text-align: center; margin-bottom: 12px; color: #FFFFFF;">Your song is approved 🎉</h1>
              
              <p style="text-align: center; font-size: 14px; margin-bottom: 24px; color: rgba(255,255,255,0.72);">Good news! Your song request has been accepted and added to the queue.</p>
              
              <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                  <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Song Title</p>
                  <p style="font-size: 14px; font-weight: 600; color: #FFFFFF;">${songTitle}</p>
                </div>
                <div>
                  <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Artist Name</p>
                  <p style="font-size: 14px; font-weight: 600; color: #FFFFFF;">${artistName}</p>
                </div>
              </div>
              
              <p style="text-align: center; font-size: 12px; margin-bottom: 24px; padding: 0 8px; color: rgba(255,255,255,0.72);">Your song will be played shortly depending on the queue.</p>
              
              <a href="${REQUEST_PAGE_URL}" class="glow-button font-display" style="display: block; width: 100%; text-decoration: none; color: #FFFFFF; font-weight: 700; padding: 16px 0; border-radius: 16px; font-size: 14px; text-align: center; margin-bottom: 12px;">
                View Status
              </a>
              
              <a href="${REQUEST_PAGE_URL}" class="secondary-button" style="display: block; width: 100%; text-decoration: none; color: #FFFFFF; font-weight: 700; padding: 16px 0; border-radius: 16px; font-size: 14px; text-align: center;">
                Request Another Song
              </a>
              
              <p style="font-size: 12px; text-align: center; margin-top: 24px; color: rgba(255,255,255,0.4);">Thank you for using MixMind</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ DJ ACCEPTANCE email sent to ${user.email}`);
    return { success: true, message: "Acceptance email sent" };
  } catch (err) {
    console.error(`❌ Failed to send DJ acceptance email:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send email when DJ rejects a request
 */
async function sendDJRejectionEmail(request, venue, rejectionReason) {
  try {
    const user = request.userId;
    const songTitle = request.title || request.songTitle;
    const artistName = request.artist || request.artistName;
    const venueId = request.venueId || venue?._id || "";
    const FRONTEND_URL = process.env.FRONTEND_URL || "https://mixmind.app";
    const REQUEST_PAGE_URL = `${FRONTEND_URL}/venue-request/${venueId}`;

    console.log(`📧 Preparing DJ REJECTION email for: ${user.email}`);

    const mailOptions = {
      from: process.env.GMAIL_USER || "noreply@mixmind.com",
      to: user.email,
      subject: "❌ Your Song Request Wasn't Approved - MixMind",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${EMAIL_HEAD}</head>
        <body style="background-color: #07070B; padding: 40px 20px;">
          <div style="max-width: 450px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, rgba(18,18,34,0.92) 0%, rgba(18,18,34,0.55) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px;">
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(168,85,247,0.15); box-shadow: 0 0 20px rgba(168,85,247,0.2); line-height: 64px; text-align: center;">
                      <img src="https://img.icons8.com/ios-filled/50/A855F7/info.png" width="32" height="32" style="vertical-align: middle;" alt="Info"/>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h1 class="font-display" style="font-size: 30px; font-weight: 700; text-align: center; margin-bottom: 12px; color: #FFFFFF;">Your request wasn't approved</h1>
              
              <p style="text-align: center; font-size: 14px; margin-bottom: 24px; color: rgba(255,255,255,0.72);">Unfortunately, your song doesn't match the venue's music policy.</p>
              
              <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                  <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Song Title</p>
                  <p style="font-size: 14px; font-weight: 600; color: #FFFFFF;">${songTitle}</p>
                </div>
                <div>
                  <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Artist Name</p>
                  <p style="font-size: 14px; font-weight: 600; color: #FFFFFF;">${artistName}</p>
                </div>
              </div>
              
              <div style="background: rgba(34,227,161,0.08); border: 1px solid rgba(34,227,161,0.2); border-radius: 12px; padding: 12px; margin-bottom: 24px;">
                <p style="text-align: center; font-size: 12px; font-weight: 600; color: #22E3A1;">✓ You were not charged for this request</p>
              </div>
              
              <a href="${REQUEST_PAGE_URL}" class="glow-button font-display" style="display: block; width: 100%; text-decoration: none; color: #FFFFFF; font-weight: 700; padding: 16px 0; border-radius: 16px; font-size: 14px; text-align: center;">
                Try Another Song
              </a>
              
              <p style="font-size: 12px; text-align: center; margin-top: 24px; color: rgba(255,255,255,0.4);">Explore different songs that match the vibe</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ DJ REJECTION email sent to ${user.email}`);
    return { success: true, message: "Rejection email sent" };
  } catch (err) {
    console.error(`❌ Failed to send DJ rejection email:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Send email when song is rejected due to genre mismatch
 */
async function sendGenreRejectionEmail(request, venue, rejectionReason, songTags) {
  try {
    const user = request.userId;
    const songTitle = request.title || request.songTitle;
    const artistName = request.artist || request.artistName;
    const venueId = request.venueId || venue?._id || "";
    const FRONTEND_URL = process.env.FRONTEND_URL || "https://mixmind.app";
    const REQUEST_PAGE_URL = `${FRONTEND_URL}/venue-request/${venueId}`;

    const mailOptions = {
      from: process.env.GMAIL_USER || "noreply@mixmind.com",
      to: user.email,
      subject: `🎵 Song Request - Genre Mismatch | ${venue?.name || "Venue"}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>${EMAIL_HEAD}</head>
        <body style="background-color: #07070B; padding: 40px 20px;">
          <div style="max-width: 450px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, rgba(18,18,34,0.92) 0%, rgba(18,18,34,0.55) 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 32px;">
              
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(168,85,247,0.15); box-shadow: 0 0 20px rgba(168,85,247,0.2); line-height: 64px; text-align: center;">
                      <img src="https://img.icons8.com/ios-filled/50/A855F7/info.png" width="32" height="32" style="vertical-align: middle;" alt="Info"/>
                    </div>
                  </td>
                </tr>
              </table>
              
              <h1 class="font-display" style="font-size: 30px; font-weight: 700; text-align: center; margin-bottom: 12px; color: #FFFFFF;">Genre Mismatch</h1>
              
              <p style="text-align: center; font-size: 14px; margin-bottom: 24px; color: rgba(255,255,255,0.72);">Unfortunately, your song doesn't match the current vibe at the venue.</p>
              
              <div style="background: rgba(168,85,247,0.08); border: 1px solid rgba(168,85,247,0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                  <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Song Title</p>
                  <p style="font-size: 14px; font-weight: 600; color: #FFFFFF;">${songTitle}</p>
                </div>
                <div style="margin-bottom: 12px;">
                  <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Artist Name</p>
                  <p style="font-size: 14px; font-weight: 600; color: #FFFFFF;">${artistName}</p>
                </div>
                <div>
                  <p style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); margin-bottom: 4px;">Detected Genres</p>
                  <p style="font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.8);">${(songTags || []).join(", ") || "Unknown"}</p>
                </div>
              </div>

              <div style="background: rgba(34,227,161,0.08); border: 1px solid rgba(34,227,161,0.2); border-radius: 12px; padding: 12px; margin-bottom: 24px;">
                <p style="text-align: center; font-size: 12px; font-weight: 600; color: #22E3A1;">✓ You were not charged for this request</p>
              </div>
              
              <a href="${REQUEST_PAGE_URL}" class="glow-button font-display" style="display: block; width: 100%; text-decoration: none; color: #FFFFFF; font-weight: 700; padding: 16px 0; border-radius: 16px; font-size: 14px; text-align: center;">
                Try Another Song
              </a>
              
              <p style="font-size: 12px; text-align: center; margin-top: 24px; color: rgba(255,255,255,0.4);">Thank you for using MixMind</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    const transporter = createTransporter();
    await transporter.sendMail(mailOptions);
    console.log(`✅ GENRE REJECTION email sent to ${user.email}`);
    return { success: true, message: "Genre rejection email sent" };
  } catch (err) {
    console.error(`❌ Failed to send genre rejection email:`, err.message);
    return { success: false, error: err.message };
  }
}

module.exports = {
  sendDJAcceptanceEmail,
  sendDJRejectionEmail,
  sendGenreRejectionEmail
};
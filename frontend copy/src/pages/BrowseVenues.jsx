import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { venueService } from "../services";
import "./BrowseVenues.css";

/**
 * Browse Venues Page
 * Customers can select a venue from a dropdown to access that venue's request page
 */
export default function BrowseVenues() {
  const navigate = useNavigate();
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      const data = await venueService.getActiveVenues();
      setVenues(data || []);
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching venues:", err.message);
      setError("Failed to load venues. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleVenueSelect = () => {
    if (!selectedVenue) {
      setError("Please select a venue");
      return;
    }
    navigate(`/venue-request/${selectedVenue}`);
  };

  return (
    <div className="browse-venues">
      <div className="browse-venues-container">
        <div className="browse-venues-card">
          <h1>🎵 Select Your Venue</h1>
          <p>Choose a venue to request a song</p>

          {error && <div className="error-message">⚠️ {error}</div>}

          {loading ? (
            <div className="loading">Loading venues...</div>
          ) : venues.length === 0 ? (
            <div className="no-venues">
              <p>😞 No active venues available at the moment</p>
              <p>Please try again later</p>
            </div>
          ) : (
            <>
              <div className="venue-select-group">
                <label htmlFor="venue-select">Select a Venue:</label>
                <select
                  id="venue-select"
                  value={selectedVenue}
                  onChange={(e) => {
                    setSelectedVenue(e.target.value);
                    setError(null);
                  }}
                  className="venue-dropdown"
                >
                  <option value="">-- Choose a venue --</option>
                  {venues.map((venue) => (
                    <option key={venue._id} value={venue._id}>
                      {venue.name}
                      {venue.city && ` - ${venue.city}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="venue-info">
                {selectedVenue && (
                  <>
                    {venues
                      .filter((v) => v._id === selectedVenue)
                      .map((venue) => (
                        <div key={venue._id} className="venue-details">
                          <h3>{venue.name}</h3>
                          {venue.description && (
                            <p className="description">{venue.description}</p>
                          )}
                          <div className="venue-meta">
                            {venue.city && (
                              <span>📍 {venue.city}, {venue.state}</span>
                            )}
                            {venue.phone && (
                              <span>📞 {venue.phone}</span>
                            )}
                            {venue.websiteUrl && (
                              <span>
                                <a
                                  href={venue.websiteUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  🌐 Website
                                </a>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                  </>
                )}
              </div>

              <button
                onClick={handleVenueSelect}
                className="btn-select-venue"
                disabled={!selectedVenue}
              >
                Continue to Request Song
              </button>
            </>
          )}

          <button onClick={() => navigate("/")} className="btn-back">
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

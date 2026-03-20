import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import VenuePaymentModalWrapper from "../componentsRequest/VenuePaymentModal";

export default function VenuePublicRequest() {
  const { venueId } = useParams();
  const [venue, setVenue] = useState(null);
  const [isVenueActive, setIsVenueActive] = useState(true);
  
  // Demo mode - prefill with test data
  const DEMO_MODE = true;
  
  const [formData, setFormData] = useState({
    songTitle: DEMO_MODE ? "Blinding Lights" : "",
    artistName: DEMO_MODE ? "The Weeknd" : "",
    userName: DEMO_MODE ? "Alex Johnson" : "",
    email: DEMO_MODE ? "alex@example.com" : "",
    price: 5
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [recentRequests, setRecentRequests] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);

  useEffect(() => {
    fetchVenueData();
  }, [venueId]);

  const fetchVenueData = async () => {
    try {
      setLoading(true);
      
      // Fetch venue details
      const venueRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/venue/public/${venueId}`
      );

      if (!venueRes.ok) {
        throw new Error("Venue not found");
      }

      const venueData = await venueRes.json();
      setVenue(venueData);
      setIsVenueActive(venueData.isActive || false);

      // Only fetch requests if venue is active
      if (venueData.isActive) {
        // Fetch recent approved requests for this venue (public view)
        const requestsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/requests/venue/${venueId}/public`
        );

        if (requestsRes.ok) {
          const requestsData = await requestsRes.json();
          setRecentRequests(requestsData.slice(0, 10)); // Show last 10
        }
      }
    } catch (err) {
      setError(err.message || "Failed to load venue");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      // Step 1: Create the request
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/requests/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.userName,
            email: formData.email,
            title: formData.songTitle,
            artist: formData.artistName,
            price: parseFloat(formData.price),
            venueId: venueId
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit request");
      }

      const { requestId } = await response.json();
      
      // Step 2: Show payment modal
      setPendingRequestId(requestId);
      setShowPaymentModal(true);

    } catch (err) {
      setError(err.message || "An error occurred");
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    // Payment authorized successfully - reset form but keep modal open to show thank you page
    // The modal handles closing when user clicks "Done" or "Request Another Song"
    setFormData({
      songTitle: "",
      artistName: "",
      userName: "",
      email: "",
      price: 5
    });
    setPendingRequestId(null);
    setSubmitting(false);

    // Refresh recent requests after a short delay
    setTimeout(async () => {
      await fetchVenueData();
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#140822] to-[#0a0712] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          <p className="text-gray-400 mt-4">Loading venue...</p>
        </div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#140822] to-[#0a0712] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg">{error || "Venue not found"}</p>
        </div>
      </div>
    );
  }

  // Venue offline check
  if (!isVenueActive) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#140822] to-[#0a0712] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🔴</div>
          <h1 className="text-3xl font-bold text-white mb-4">Venue Offline</h1>
          <p className="text-gray-300 text-lg mb-6">
            {venue.name} is currently offline and not accepting requests.
          </p>
          <p className="text-gray-400 mb-8">
            Please check back later or visit another venue.
          </p>
          <a
            href="/browse-venues"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            Browse Other Venues
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#140822] to-[#0a0712] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-b border-purple-500/20 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{venue.name}</h1>
          <p className="text-gray-400 text-lg mb-4">{venue.description}</p>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            {venue.address && (
              <>
                <span>📍 {venue.address}</span>
              </>
            )}
            {venue.phone && (
              <>
                <span>📱 {venue.phone}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Request Form */}
          <div className="lg:col-span-2">
            <div className="bg-[#1a0f2e] border border-purple-500/20 rounded-lg p-8">
              <h2 className="text-2xl font-bold mb-6">Request a Song</h2>

              {success && (
                <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
                  <p className="text-green-300">✅ Song request submitted and payment authorized! Your song will be added after venue approval.</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-300">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Song Title *</label>
                  <input
                    type="text"
                    name="songTitle"
                    value={formData.songTitle}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Blinding Lights"
                    className="w-full px-4 py-2 bg-[#0a0712] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Artist Name *</label>
                  <input
                    type="text"
                    name="artistName"
                    value={formData.artistName}
                    onChange={handleChange}
                    required
                    placeholder="e.g., The Weeknd"
                    className="w-full px-4 py-2 bg-[#0a0712] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Your Name *</label>
                  <input
                    type="text"
                    name="userName"
                    value={formData.userName}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                    className="w-full px-4 py-2 bg-[#0a0712] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 bg-[#0a0712] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Request Fee (USD) *</label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">$</span>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      min="1"
                      step="0.01"
                      placeholder="5.00"
                      className="flex-1 px-4 py-2 bg-[#0a0712] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500"
                      disabled={submitting}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Amount will be charged after venue approval</p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity mt-6"
                >
                  {submitting ? "Processing..." : "Continue to Payment →"}
                </button>
              </form>
            </div>
          </div>

          {/* Venue Info Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#1a0f2e] border border-purple-500/20 rounded-lg p-6">
              <h3 className="text-lg font-bold mb-4">Venue Info</h3>
              <div className="space-y-3 text-sm">
                {venue.city && (
                  <div>
                    <p className="text-gray-400">City</p>
                    <p className="text-white">{venue.city}, {venue.state}</p>
                  </div>
                )}
                {venue.websiteUrl && (
                  <div>
                    <p className="text-gray-400">Website</p>
                    <a
                      href={venue.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-400 hover:text-purple-300 break-all"
                    >
                      {venue.websiteUrl}
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-purple-900/20 border border-purple-500/20 rounded-lg p-6">
              <h4 className="font-semibold mb-2">How it works</h4>
              <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                <li>Submit your song request</li>
                <li>Authorize payment securely</li>
                <li>Venue admin reviews request</li>
                <li>Payment charged upon approval</li>
                <li>Song added to playlist</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Recent Requests */}
        {recentRequests.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">Recently Played</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="bg-[#1a0f2e] border border-purple-500/20 rounded-lg p-4"
                >
                  <p className="font-semibold text-lg">{request.songTitle}</p>
                  <p className="text-gray-400">{request.artistName}</p>
                  <p className="text-sm text-gray-500 mt-2">Requested by {request.userName}</p>
                  <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-300">
                    Played
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <VenuePaymentModalWrapper
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setPendingRequestId(null);
          setSubmitting(false);
        }}
        requestId={pendingRequestId}
        amount={parseFloat(formData.price)}
        venueId={venueId}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}

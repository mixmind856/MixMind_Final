import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import { X, Loader2, AlertCircle, CheckCircle2, Music, ArrowRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

// 🔧 DEMO MODE - Set to false when you have real Stripe keys
const DEMO_MODE = true;

const stripePromise = DEMO_MODE 
  ? Promise.resolve(null)  // Don't load Stripe in demo mode
  : loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const STRIPE_ELEMENT_STYLE = {
  style: {
    base: {
      fontSize: "16px",
      color: "#ffffff",
      fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
      "::placeholder": {
        color: "#9CA3AF"
      }
    },
    invalid: {
      color: "#EF4444"
    }
  }
};

export default function VenuePaymentModalWrapper({ 
  isOpen, 
  onClose, 
  requestId, 
  amount, 
  venueId,
  onPaymentSuccess 
}) {
  if (!isOpen) return null;

  return (
    <Elements stripe={stripePromise}>
      <VenuePaymentModalContent
        onClose={onClose}
        requestId={requestId}
        amount={amount}
        venueId={venueId}
        onPaymentSuccess={onPaymentSuccess}
      />
    </Elements>
  );
}

function VenuePaymentModalContent({ 
  onClose, 
  requestId, 
  amount, 
  venueId,
  onPaymentSuccess 
}) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("form"); // form, processing, success, error
  const [cardName, setCardName] = useState("");
  
  // Demo mode - prefill with test data
  const DEMO_MODE = true;

  useEffect(() => {
    if (DEMO_MODE) {
      setCardName("John Test Developer");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!cardName.trim()) {
      setError("Please enter the cardholder name");
      return;
    }

    setLoading(true);
    setError(null);
    setStep("processing");

    try {
      if (DEMO_MODE) {
        // 🎪 DEMO MODE - Mock Stripe payment
        console.log("🎪 DEMO MODE - Simulating Stripe payment...");
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log("✅ Demo payment authorized for request:", requestId);
        
        // Success - payment is authorized
        onPaymentSuccess?.();
        
        // Navigate to thank you page after a brief delay
        setTimeout(() => {
          onClose();
          navigate('/thank-you');
        }, 2000);
        
      } else {
        // 💳 REAL STRIPE MODE
        const stripe = useStripe();
        const elements = useElements();

        if (!stripe || !elements) {
          setError("⚠️ Stripe not loaded. Please refresh the page.");
          setLoading(false);
          return;
        }

        // Step 1: Create payment intent on backend
        console.log("🔄 Creating payment intent for request:", requestId);
        console.log("📍 API URL:", API);
        
        const intentRes = await fetch(`${API}/api/payments/venue-intent`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            requestId,
            venueId
          })
        });

        console.log("📊 Response status:", intentRes.status);

        if (!intentRes.ok) {
          const contentType = intentRes.headers.get("content-type");
          let data;
          
          if (contentType && contentType.includes("application/json")) {
            data = await intentRes.json();
            throw new Error(data.error || `Server error: ${intentRes.status}`);
          } else {
            const text = await intentRes.text();
            console.error("Non-JSON response:", text.substring(0, 200));
            throw new Error(`Backend returned ${intentRes.status}: ${text.substring(0, 100)}`);
          }
        }

        const { clientSecret } = await intentRes.json();

        if (!clientSecret) {
          throw new Error("No client secret returned from server - check backend logs");
        }

        console.log("✅ Payment intent created, client secret received");

        // Step 2: Confirm payment with card element
        console.log("💳 Confirming card payment...");
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          throw new Error("Card element not found - Stripe library issue");
        }

        const { paymentIntent, error: paymentError } = await stripe.confirmCardPayment(
          clientSecret,
          {
            payment_method: {
              card: cardElement,
              billing_details: {
                name: cardName
              }
            }
          }
        );

        if (paymentError) {
          throw new Error(`Card error: ${paymentError.message}`);
        }

        if (!paymentIntent) {
          throw new Error("Payment intent not returned - unknown error");
        }

        if (paymentIntent.status === "requires_action") {
          throw new Error("Payment requires additional authentication - please try again");
        }

        console.log("✅ Payment intent authorized:", paymentIntent.id);

        // Step 3: Success - payment is authorized
        onPaymentSuccess?.();
        
        // Navigate to thank you page after a brief delay
        setTimeout(() => {
          onClose();
          navigate('/thank-you');
        }, 2000);
      }

    } catch (err) {
      console.error("❌ Payment error:", err);
      setError(err.message || "Payment failed. Please try again.");
      setStep("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a0f2e] border border-purple-500/30 rounded-lg w-full max-w-md relative max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            {DEMO_MODE ? "🎪 Demo Payment" : "💳 Payment Required"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount Display */}
              <div className="bg-purple-900/30 border border-purple-500/20 rounded-lg p-4 mb-6">
                <div className="text-gray-300 text-sm">Total Amount</div>
                <div className="text-3xl font-bold text-purple-400">
                  ${(amount || 0).toFixed(2)}
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  ℹ️ Payment authorized now • Charged only after venue admin approves this request
                </p>
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 bg-[#0a0712] border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500 text-white placeholder-gray-500 transition"
                  disabled={loading}
                />
              </div>

              {/* Card Element */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {DEMO_MODE ? "🎪 Demo Card Details" : "Card Details"}
                </label>
                {DEMO_MODE ? (
                  <div className="px-4 py-3 bg-[#0a0712] border border-yellow-500/30 rounded-lg text-yellow-300 text-sm space-y-2">
                    <p>📝 Demo Mode - Any card details accepted:</p>
                    <ul className="list-disc list-inside text-xs">
                      <li>Card: 4242 4242 4242 4242</li>
                      <li>Expiry: 12/27</li>
                      <li>CVC: 123</li>
                    </ul>
                  </div>
                ) : (
                  <div className="px-4 py-3 bg-[#0a0712] border border-purple-500/30 rounded-lg">
                    <CardElement options={STRIPE_ELEMENT_STYLE} />
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <AlertCircle size={20} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || (!DEMO_MODE && (!stripe || !elements))}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-6"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : DEMO_MODE ? (
                  "✅ Demo Authorize Payment"
                ) : (
                  "Authorize Payment"
                )}
              </button>

              <p className="text-xs text-gray-400 text-center mt-4">
                Your payment information is secured by Stripe
              </p>
            </form>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Loader2 size={48} className="text-purple-400 animate-spin mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Processing Payment
              </h4>
              <p className="text-gray-400">
                Please wait while we authorize your payment...
              </p>
            </div>
          )}

          {step === "success" && (
            <div className="relative overflow-hidden py-16 text-center">
              {/* Confetti Animation */}
              {confetti.map((particle) => (
                <div
                  key={particle.id}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${particle.left}%`,
                    top: '-10px',
                    animation: `fall ${particle.duration}s linear ${particle.delay}s forwards`,
                    opacity: 0.8
                  }}
                >
                  <div
                    style={{
                      width: `${particle.size}px`,
                      height: `${particle.size}px`,
                      backgroundColor: ['#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'][Math.floor(Math.random() * 5)],
                      borderRadius: '50%',
                      boxShadow: '0 0 10px rgba(168, 139, 250, 0.6)'
                    }}
                  />
                </div>
              ))}

              <style>{`
                @keyframes scaleIn {
                  0% { transform: scale(0); opacity: 0; }
                  50% { transform: scale(1.2); }
                  100% { transform: scale(1); opacity: 1; }
                }
                @keyframes slideDown {
                  0% { transform: translateY(-20px); opacity: 0; }
                  100% { transform: translateY(0); opacity: 1; }
                }
                @keyframes pulse {
                  0%, 100% { box-shadow: 0 0 0 0 rgba(168, 139, 250, 0.7); }
                  50% { box-shadow: 0 0 0 20px rgba(168, 139, 250, 0); }
                }
                @keyframes fall {
                  to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .checkmark-circle {
                  animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .checkmark-circle::after {
                  content: '';
                  position: absolute;
                  animation: pulse 2s infinite;
                }
                .success-text {
                  animation: slideDown 0.6s ease-out 0.3s both;
                }
                .success-desc {
                  animation: slideDown 0.6s ease-out 0.5s both;
                }
                .action-buttons {
                  animation: slideDown 0.6s ease-out 0.7s both;
                }
              `}</style>

              {/* Success Checkmark */}
              <div className="relative mb-6">
                <div className="checkmark-circle w-20 h-20 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center relative">
                  <CheckCircle2 size={48} className="text-white" />
                </div>
              </div>

              <h4 className="success-text text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-3">
                Payment Authorized!
              </h4>
              <p className="success-desc text-gray-300 text-sm leading-relaxed">
                🎉 Your payment has been secured and authorized.
              </p>
              <p className="success-desc text-gray-400 text-xs mb-6">
                It will be charged after the venue admin approves your request.
              </p>

              {/* Action Buttons */}
              <div className="action-buttons flex flex-col gap-3 mt-8">
                <button
                  onClick={() => {
                    onClose();
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-6 rounded-lg transition transform hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  <span>Done</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('/request');
                  }}
                  className="w-full bg-white/10 hover:bg-white/20 border border-purple-500/50 hover:border-purple-500 text-white font-semibold py-3 px-6 rounded-lg transition transform hover:scale-105 flex items-center justify-center gap-2 group"
                >
                  <Music size={18} className="group-hover:rotate-12 transition" />
                  <span>Request Another Song</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-6">
                ✓ Transaction is secure and encrypted
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <h4 className="text-lg font-semibold text-white mb-2">
                Payment Failed ❌
              </h4>
              <p className="text-gray-400 text-sm mb-6">
                {error}
              </p>
              <button
                onClick={() => {
                  setStep("form");
                  setError(null);
                  setCardName("");
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

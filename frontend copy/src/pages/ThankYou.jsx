import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Music, ArrowRight } from "lucide-react";

export default function ThankYou() {
  const navigate = useNavigate();
  const [confetti, setConfetti] = useState([]);

  // Generate confetti particles on mount
  useEffect(() => {
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1,
      size: 5 + Math.random() * 15,
      color: ['#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#fb7185'][Math.floor(Math.random() * 5)]
    }));
    setConfetti(particles);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#140822] to-[#0a0712] text-white flex items-center justify-center relative overflow-hidden p-4">
      {/* Confetti Animation */}
      {confetti.map((particle) => (
        <div
          key={particle.id}
          className="fixed pointer-events-none"
          style={{
            left: `${particle.left}%`,
            top: '-10px',
            animation: `fall ${particle.duration}s linear ${particle.delay}s forwards`,
            opacity: 0.8,
            zIndex: 10
          }}
        >
          <div
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 10px ${particle.color}80`
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
          box-shadow: 0 0 0 0 rgba(168, 139, 250, 0.7);
          animation-list: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), pulse 2s infinite;
        }
        .success-title {
          animation: slideDown 0.6s ease-out 0.3s both;
        }
        .success-desc {
          animation: slideDown 0.6s ease-out 0.5s both;
        }
        .action-buttons {
          animation: slideDown 0.6s ease-out 0.7s both;
        }
      `}</style>

      {/* Main Content */}
      <div className="text-center max-w-2xl relative z-20">
        {/* Success Checkmark */}
        <div className="mb-8">
          <div className="checkmark-circle w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <CheckCircle2 size={56} className="text-white" />
          </div>
        </div>

        {/* Title */}
        <h1 className="success-title text-5xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent mb-4">
          Payment Authorized!
        </h1>

        {/* Description */}
        <div className="success-desc mb-8">
          <p className="text-xl text-gray-200 mb-3">
            🎉 Your payment has been secured and authorized.
          </p>
          <p className="text-gray-400 text-lg">
            It will be charged after the venue admin approves your request.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons flex flex-col gap-4 mt-12">
          <button
            onClick={() => navigate('/request')}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-8 rounded-lg transition transform hover:scale-105 flex items-center justify-center gap-3 group text-lg"
          >
            <Music size={24} className="group-hover:rotate-12 transition" />
            <span>Request Another Song</span>
            <ArrowRight size={24} className="group-hover:translate-x-1 transition" />
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-white/10 hover:bg-white/20 border border-purple-500/50 hover:border-purple-500 text-white font-semibold py-4 px-8 rounded-lg transition transform hover:scale-105"
          >
            Back to Home
          </button>
        </div>

        {/* Security Badge */}
        <p className="text-xs text-gray-500 mt-12">
          ✓ Transaction is secure and encrypted
        </p>
      </div>
    </div>
  );
}

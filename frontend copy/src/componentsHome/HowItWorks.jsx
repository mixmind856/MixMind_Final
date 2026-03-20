export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <div className="radial-glow pulse-glow" style={{ top: '50%', right: '-200px', transform: 'translateY(-50%)' }}></div>
      <div className="radial-glow pulse-glow" style={{ top: '20%', left: '-200px', animationDelay: '2s' }}></div>

      {/* Floating Music Notes */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="music-note" style={{ left: '10%', top: '20%', animationDelay: '0s' }}>♪</div>
        <div className="music-note" style={{ left: '80%', top: '30%', animationDelay: '1.5s' }}>♫</div>
        <div className="music-note" style={{ left: '15%', top: '60%', animationDelay: '3s' }}>♪</div>
        <div className="music-note" style={{ left: '75%', top: '70%', animationDelay: '2s' }}>♫</div>
        <div className="music-note" style={{ left: '50%', top: '15%', animationDelay: '4s' }}>♪</div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-purple-400 font-medium text-sm uppercase tracking-wider mb-4 block">The MixMind Solution</span>
          <h2 className="font-display text-4xl md:text-5xl font-bold">How it works</h2>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-1 timeline-line rounded-full opacity-30"></div>
          
          {/* Animated pulse traveling down line */}
          <div className="hidden md:block absolute left-1/2 top-0 w-3 h-3 rounded-full -ml-1" 
               style={{ background: 'var(--neon-purple)', boxShadow: '0 0 20px var(--neon-purple)', animation: 'travel-line 6s ease-in-out infinite' }}></div>

          <div className="space-y-12 md:space-y-0" style={{ perspective: '1000px' }}>
            {/* Step 1 */}
            <div className="md:flex items-center">
              <div className="md:w-1/2 md:pr-12 md:text-right mb-6 md:mb-0">
                <div className="glass-card rounded-2xl p-8 inline-block feature-card">
                  <div className="w-48 h-48 rounded-2xl flex items-center justify-center mb-6 mx-auto md:ml-auto md:mr-0 glow-purple relative overflow-hidden p-4" 
                       style={{ background: 'white', boxShadow: '0 0 60px rgba(168, 85, 247, 0.6), 0 0 100px rgba(168, 85, 247, 0.3)' }}>
                    <svg className="w-full h-full" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="0" width="7" height="7" fill="#000" />
                      <rect x="1" y="1" width="5" height="5" fill="#FFF" />
                      <rect x="2" y="2" width="3" height="3" fill="#000" />
                      <rect x="26" y="0" width="7" height="7" fill="#000" />
                      <rect x="27" y="1" width="5" height="5" fill="#FFF" />
                      <rect x="28" y="2" width="3" height="3" fill="#000" />
                      <rect x="0" y="26" width="7" height="7" fill="#000" />
                      <rect x="1" y="27" width="5" height="5" fill="#FFF" />
                      <rect x="2" y="28" width="3" height="3" fill="#000" />
                      <rect x="8" y="6" width="1" height="1" fill="#000" />
                      <rect x="10" y="6" width="1" height="1" fill="#000" />
                      <rect x="12" y="6" width="1" height="1" fill="#000" />
                      <rect x="14" y="6" width="1" height="1" fill="#000" />
                      <rect x="16" y="6" width="1" height="1" fill="#000" />
                      <rect x="18" y="6" width="1" height="1" fill="#000" />
                      <rect x="20" y="6" width="1" height="1" fill="#000" />
                      <rect x="22" y="6" width="1" height="1" fill="#000" />
                      <rect x="24" y="6" width="1" height="1" fill="#000" />
                      <rect x="6" y="8" width="1" height="1" fill="#000" />
                      <rect x="6" y="10" width="1" height="1" fill="#000" />
                      <rect x="6" y="12" width="1" height="1" fill="#000" />
                      <rect x="6" y="14" width="1" height="1" fill="#000" />
                      <rect x="6" y="16" width="1" height="1" fill="#000" />
                      <rect x="6" y="18" width="1" height="1" fill="#000" />
                      <rect x="6" y="20" width="1" height="1" fill="#000" />
                      <rect x="6" y="22" width="1" height="1" fill="#000" />
                      <rect x="6" y="24" width="1" height="1" fill="#000" />
                      <rect x="22" y="22" width="5" height="5" fill="#000" />
                      <rect x="23" y="23" width="3" height="3" fill="#FFF" />
                      <rect x="24" y="24" width="1" height="1" fill="#000" />
                      <rect x="8" y="8" width="1" height="1" fill="#000" />
                      <rect x="9" y="8" width="1" height="1" fill="#000" />
                      <rect x="11" y="8" width="1" height="1" fill="#000" />
                      <rect x="13" y="8" width="1" height="1" fill="#000" />
                      <rect x="14" y="8" width="1" height="1" fill="#000" />
                      <rect x="16" y="8" width="1" height="1" fill="#000" />
                      <rect x="18" y="8" width="1" height="1" fill="#000" />
                      <rect x="19" y="8" width="1" height="1" fill="#000" />
                      <rect x="21" y="8" width="1" height="1" fill="#000" />
                    </svg>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">Scan the QR Code</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Customer scans a QR code at their table or at the bar</p>
                </div>
              </div>
              <div className="hidden md:flex w-14 h-14 rounded-full items-center justify-center font-display font-bold text-xl z-10 glow-purple" 
                   style={{ background: 'linear-gradient(135deg, var(--neon-purple), var(--electric-violet))', boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' }}>
                1
              </div>
              <div className="md:w-1/2 md:pl-12"></div>
            </div>

            {/* Step 2 */}
            <div className="md:flex items-center md:mt-[-40px]">
              <div className="md:w-1/2 md:pr-12"></div>
              <div className="hidden md:flex w-14 h-14 rounded-full items-center justify-center font-display font-bold text-xl z-10 glow-purple" 
                   style={{ background: 'linear-gradient(135deg, var(--neon-purple), var(--electric-violet))', boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' }}>
                2
              </div>
              <div className="md:w-1/2 md:pl-12 mb-6 md:mb-0">
                <div className="glass-card rounded-2xl p-8 inline-block feature-card">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 glow-purple relative" 
                       style={{ background: 'linear-gradient(135deg, var(--neon-purple), var(--electric-violet))' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="absolute -top-2 -right-2 text-2xl">💸</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">Request & Pay</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>Choose a song and pay from <span className="revenue-text font-bold">£3</span> per request</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="md:flex items-center md:mt-[-40px]">
              <div className="md:w-1/2 md:pr-12 md:text-right">
                <div className="glass-card rounded-2xl p-8 inline-block feature-card">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 mx-auto md:ml-auto md:mr-0 glow-purple relative" 
                       style={{ background: 'linear-gradient(135deg, var(--neon-purple), var(--electric-violet))' }}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <span className="absolute -top-2 -right-2 text-2xl animate-pulse">✨</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold mb-2">Auto-Play Magic ✨</h3>
                  <p style={{ color: 'var(--text-secondary)' }}>MixMind's AI mixer plays it seamlessly within 10–15 minutes</p>
                </div>
              </div>
              <div className="hidden md:flex w-14 h-14 rounded-full items-center justify-center font-display font-bold text-xl z-10 glow-purple" 
                   style={{ background: 'linear-gradient(135deg, var(--neon-purple), var(--electric-violet))', boxShadow: '0 0 30px rgba(168, 85, 247, 0.6)' }}>
                3
              </div>
              <div className="md:w-1/2 md:pl-12"></div>
            </div>
          </div>
        </div>

        {/* Key Points */}
        <div className="mt-16 text-center">
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="px-6 py-3 rounded-full border" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>✓ No staff involvement</span>
            </div>
            <div className="px-6 py-3 rounded-full border" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>✓ No DJ required</span>
            </div>
            <div className="px-6 py-3 rounded-full border" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>✓ No playlists to manage</span>
            </div>
          </div>
          <p className="font-display text-3xl md:text-4xl font-bold gradient-text">"Plug it in. Forget it. Earn from it."</p>
        </div>
      </div>
    </section>
  )
}

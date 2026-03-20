import { useInView } from '../hooks/useInView'

export default function Features() {
  const [ref, isInView] = useInView({ once: true })
  const features = [
    {
      title: 'AI Auto-Mixer',
      desc: 'Seamless transitions, no silence, professional DJ-like feel — all automated.',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
    },
    {
      title: 'Fully Automated',
      desc: 'Zero approvals, zero manual control. Set it up once and let it run.',
      icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
    },
    {
      title: 'Copyright-Safe',
      desc: 'Fully licensed streaming. No Spotify, no personal accounts, no fines.',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    },
    {
      title: 'Built for Venues',
      desc: 'Designed specifically for bars, clubs, lounges, and student venues.',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
    }
  ]

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-bg-base" style={{ background: 'var(--bg-base)' }}>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .feature-card-item {
          animation: ${isInView ? 'fadeInUp 0.6s ease-out both' : 'none'};
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .feature-card-item:nth-child(1) { animation-delay: ${isInView ? '0.1s' : '0'}; }
        .feature-card-item:nth-child(2) { animation-delay: ${isInView ? '0.2s' : '0'}; }
        .feature-card-item:nth-child(3) { animation-delay: ${isInView ? '0.3s' : '0'}; }
        .feature-card-item:nth-child(4) { animation-delay: ${isInView ? '0.4s' : '0'}; }
        .feature-card-item:nth-child(5) { animation-delay: ${isInView ? '0.5s' : '0'}; }
        
        .feature-card-item:hover {
          transform: translateY(-12px) scale(1.02);
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
          <span className="text-purple-400 font-medium text-xs sm:text-sm uppercase tracking-wider mb-3 block">Why MixMind</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold">What makes us different</h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {features.slice(0, 4).map((feature, idx) => (
            <div key={idx} className="feature-card-item glass-card feature-card rounded-2xl p-6 sm:p-8">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl flex items-center justify-center mb-4 sm:mb-6" 
                   style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(124, 58, 237, 0.2))' }}>
                <svg className="w-6 sm:w-7 h-6 sm:h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={feature.icon} />
                </svg>
              </div>
              <h3 className="font-display text-lg sm:text-xl font-bold mb-2 sm:mb-3">{feature.title}</h3>
              <p style={{ color: 'var(--text-secondary)' }} className="text-sm sm:text-base">{feature.desc}</p>
            </div>
          ))}

          {/* Revenue Feature - Spans 2 columns */}
          <div className="glass-card feature-card rounded-2xl p-6 sm:p-8 md:col-span-2 lg:col-span-2">
            <div className="flex flex-col md:flex-row md:items-center gap-4 sm:gap-6">
              <div className="w-12 sm:w-14 h-12 sm:h-14 rounded-xl flex items-center justify-center shrink-0" 
                   style={{ background: 'linear-gradient(135deg, rgba(34, 227, 161, 0.2), rgba(34, 227, 161, 0.1))' }}>
                <svg className="w-6 sm:w-7 h-6 sm:h-7" style={{ color: 'var(--revenue-green)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-display text-lg sm:text-xl font-bold mb-2 sm:mb-3">Revenue-First Design</h3>
                <p style={{ color: 'var(--text-secondary)' }} className="text-sm sm:text-base">Music becomes a profit centre, not a cost centre. Every song request puts money directly in your till.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

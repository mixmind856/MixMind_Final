import { useInView } from '../hooks/useInView'

export default function VenueTypes() {
  const [ref, isInView] = useInView({ once: true })
  const venues = [
    { name: 'Bars & Pubs', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { name: 'Nightclubs', icon: 'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' },
    { name: 'Student Venues', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
    { name: 'Lounges', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
    { name: 'Event Spaces', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
  ]

  return (
    <section ref={ref} className="py-16 sm:py-24 bg-bg-base" style={{ background: 'var(--bg-base)' }}>
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .venue-tile-item {
          animation: slideIn 0.6s ease-out both;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .venue-tile-item:nth-child(1) { animation-delay: ${isInView ? '0.1s' : '0'}; animation-name: slideIn; }
        .venue-tile-item:nth-child(2) { animation-delay: ${isInView ? '0.2s' : '0'}; animation-name: slideInRight; }
        .venue-tile-item:nth-child(3) { animation-delay: ${isInView ? '0.3s' : '0'}; animation-name: slideIn; }
        .venue-tile-item:nth-child(4) { animation-delay: ${isInView ? '0.4s' : '0'}; animation-name: slideInRight; }
        .venue-tile-item:nth-child(5) { animation-delay: ${isInView ? '0.5s' : '0'}; animation-name: slideIn; }
        
        .venue-tile-item:hover {
          transform: translateY(-8px) scale(1.05);
          border-color: rgba(168, 85, 247, 0.6);
          box-shadow: 0 10px 50px rgba(168, 85, 247, 0.3);
        }
      `}</style>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16" style={{ animation: 'fadeInUp 0.8s ease-out' }}>
          <span className="text-purple-400 font-medium text-xs sm:text-sm uppercase tracking-wider mb-3 block">Perfect For</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold">Built for UK nightlife venues</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {venues.map((venue, idx) => (
            <div key={idx} className="venue-tile-item venue-tile glass-card rounded-2xl p-4 sm:p-6 text-center">
              <div className="w-12 sm:w-16 h-12 sm:h-16 mx-auto rounded-2xl flex items-center justify-center mb-3 sm:mb-4" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                <svg className="w-5 sm:w-8 h-5 sm:h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={venue.icon} />
                </svg>
              </div>
              <h3 className="font-display font-semibold text-sm sm:text-base">{venue.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

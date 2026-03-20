import { useState } from 'react'
import Navigation from './componentsHome/Navigation'
import Hero from './componentsHome/Hero'
import Problems from './componentsHome/Problems'
import HowItWorks from './componentsHome/HowItWorks'
import Features from './componentsHome/Features'
import BusinessValue from './componentsHome/BusinessValue'
import VenueTypes from './componentsHome/VenueTypes'
import Waitlist from './componentsHome/Waitlist'
import Footer from './componentsHome/Footer'
import LoginModal from './componentsHome/LoginModal'

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [loginType, setLoginType] = useState('customer')

  const openLoginModal = (type) => {
    setLoginType(type)
    setIsLoginModalOpen(true)
  }

  const closeLoginModal = () => {
    setIsLoginModalOpen(false)
  }

  return (
    <div className="w-full min-h-screen bg-bg-deep text-white overflow-x-hidden">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={closeLoginModal} 
        type={loginType}
      />
      <Navigation onLoginClick={openLoginModal} />
      <Hero />
      <div className="h-12 md:h-16 bg-gradient-to-b from-bg-deep to-bg-base"></div>
      <Problems />
      <div className="h-12 md:h-16 bg-gradient-to-b from-bg-base to-bg-deep"></div>
      <HowItWorks />
      <Features />
      <BusinessValue />
      <VenueTypes />
      <Waitlist />
      <Footer />
    </div>
  )
}

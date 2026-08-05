'use client'

import { useState } from 'react'
import CinematicIntro from '@/components/CinematicIntro'
import Login from '@/components/Login'

export default function Home() {
  const [showIntro, setShowIntro] = useState(true)
  const [showLogin, setShowLogin] = useState(false)

  const handleIntroComplete = () => {
    setShowIntro(false)
    setShowLogin(true)
  }

  return (
    <main className="min-h-screen bg-dark-bg">
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      {showLogin && <Login />}
    </main>
  )
}

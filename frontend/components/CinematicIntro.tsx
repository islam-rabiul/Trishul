'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import gsap from 'gsap'

function TrishulModel() {
  const meshRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)

  useEffect(() => {
    if (!meshRef.current) return

    const timeline = gsap.timeline({
      onComplete: () => {
        // Trigger completion callback
        window.dispatchEvent(new Event('introComplete'))
      }
    })

    // Initial position - high in the sky
    gsap.set(meshRef.current.position, { y: 15 })
    gsap.set(meshRef.current.rotation, { x: 0, y: 0, z: 0 })

    // Drop from sky with rotation
    timeline.to(meshRef.current.position, {
      y: 0,
      duration: 2,
      ease: 'power4.in',
    }, 0)

    timeline.to(meshRef.current.rotation, {
      x: Math.PI * 2,
      y: Math.PI * 4,
      z: Math.PI,
      duration: 2,
      ease: 'power2.inOut',
    }, 0)

    // Impact effect
    timeline.to(meshRef.current.position, {
      y: -0.5,
      duration: 0.1,
      ease: 'power4.out',
    }, 2)

    timeline.to(meshRef.current.position, {
      y: 0,
      duration: 0.3,
      ease: 'elastic.out(1, 0.5)',
    }, 2.1)

    // Flash effect
    timeline.to({}, {
      duration: 0.1,
      onStart: () => {
        document.body.style.backgroundColor = '#ffffff'
      },
      onComplete: () => {
        document.body.style.backgroundColor = '#0a0a0f'
      }
    }, 2)

    // Final settle
    timeline.to(meshRef.current.rotation, {
      x: 0,
      y: Math.PI / 4,
      z: 0,
      duration: 1,
      ease: 'power2.out',
    }, 2.3)

    // Fade out
    timeline.to(meshRef.current.scale, {
      x: 0,
      y: 0,
      z: 0,
      duration: 0.5,
      ease: 'power2.in',
    }, 3)

  }, [])

  return (
    <group ref={meshRef}>
      {/* Main Trishul structure - Three prongs */}
      <group>
        {/* Crown and spear tips give the Trishul a more sculpted silhouette. */}
        <mesh position={[0, 4.15, 0]}>
          <coneGeometry args={[0.34, 1.1, 4]} />
          <meshStandardMaterial color="#f8d783" emissive="#d99022" emissiveIntensity={.65} metalness={.95} roughness={.16} />
        </mesh>
        <mesh position={[-1.05, 3.15, 0]} rotation={[0, 0, .3]}>
          <coneGeometry args={[0.26, .86, 4]} />
          <meshStandardMaterial color="#e6a332" emissive="#bc6d14" emissiveIntensity={.55} metalness={.9} roughness={.18} />
        </mesh>
        <mesh position={[1.05, 3.15, 0]} rotation={[0, 0, -.3]}>
          <coneGeometry args={[0.26, .86, 4]} />
          <meshStandardMaterial color="#e6a332" emissive="#bc6d14" emissiveIntensity={.55} metalness={.9} roughness={.18} />
        </mesh>

        {/* Center prong */}
        <mesh position={[0, 2.05, 0]}>
          <cylinderGeometry args={[0.1, 0.15, 4, 8]} />
          <meshStandardMaterial 
            color="#f3bd48" 
            emissive="#cf7a17" 
            emissiveIntensity={0.65}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Left prong */}
        <mesh position={[-.62, 1.65, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.08, 0.12, 3, 8]} />
          <meshStandardMaterial 
            color="#e6a332" 
            emissive="#bc6d14" 
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Right prong */}
        <mesh position={[.62, 1.65, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.08, 0.12, 3, 8]} />
          <meshStandardMaterial 
            color="#e6a332" 
            emissive="#bc6d14" 
            emissiveIntensity={0.6}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Handle */}
        <mesh position={[0, -1.5, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 3, 8]} />
          <meshStandardMaterial 
            color="#472a20" 
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Decorative rings */}
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[0.3, 0.05, 8, 32]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        <mesh position={[0, -0.5, 0]}>
          <torusGeometry args={[0.25, 0.04, 8, 32]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={0.3}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        <mesh position={[0, .15, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[.72, .08, 10, 48]} />
          <meshStandardMaterial color="#f6ce71" emissive="#d5891e" emissiveIntensity={.45} metalness={.9} roughness={.15} />
        </mesh>
      </group>

      {/* Lightning effects */}
      <group>
        {[...Array(5)].map((_, i) => (
          <mesh key={i} position={[Math.random() - 0.5, Math.random() * 3, Math.random() - 0.5]}>
            <cylinderGeometry args={[0.02, 0.02, Math.random() * 2 + 1, 4]} />
            <meshStandardMaterial 
              color="#fbbf24" 
              emissive="#fbbf24" 
              emissiveIntensity={2}
              transparent
              opacity={0.8}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function EnergyHalo() {
  const haloRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!haloRef.current) return
    haloRef.current.rotation.z = state.clock.elapsedTime * .32
    haloRef.current.rotation.x = Math.sin(state.clock.elapsedTime * .65) * .2
  })

  return (
    <group ref={haloRef} position={[0, .6, -1]}>
      {[1.9, 2.45, 3.05].map((radius, index) => (
        <mesh key={radius} rotation={[index * .45, index * .3, index * .6]}>
          <torusGeometry args={[radius, .018 + index * .01, 8, 96]} />
          <meshBasicMaterial color={index === 1 ? '#f6bd47' : '#37d9cf'} transparent opacity={.42 - index * .08} />
        </mesh>
      ))}
    </group>
  )
}

function Particles() {
  const particlesRef = useRef<THREE.Points>(null)

  useEffect(() => {
    if (!particlesRef.current) return

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    const count = positions.length / 3
    let frameId: number

    // Animate particles
    const animate = () => {
      const particles = particlesRef.current
      if (!particles) return
      for (let i = 0; i < count; i++) {
        positions[i * 3 + 1] -= 0.02 // Move down
        if (positions[i * 3 + 1] < -10) {
          positions[i * 3 + 1] = 10
        }
      }
      particles.geometry.attributes.position.needsUpdate = true
      frameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(frameId)
  }, [])

  const particlesGeometry = new THREE.BufferGeometry()
  const particleCount = 500
  const positions = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 20
    positions[i + 1] = Math.random() * 20
    positions[i + 2] = (Math.random() - 0.5) * 20
  }

  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  return (
    <points ref={particlesRef} geometry={particlesGeometry}>
      <pointsMaterial 
        size={0.05} 
        color="#0ea5e9" 
        transparent 
        opacity={0.6}
      />
    </points>
  )
}

interface CinematicIntroProps {
  onComplete: () => void
}

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [impact, setImpact] = useState(false)
  const [reveal, setReveal] = useState(false)

  useEffect(() => {
    const handleComplete = () => {
      onComplete()
    }

    window.addEventListener('introComplete', handleComplete)
    return () => window.removeEventListener('introComplete', handleComplete)
  }, [onComplete])

  useEffect(() => {
    const impactTimer = window.setTimeout(() => setImpact(true), 1950)
    const revealTimer = window.setTimeout(() => setReveal(true), 2550)
    return () => {
      window.clearTimeout(impactTimer)
      window.clearTimeout(revealTimer)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#07060a]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(247,181,55,.14),transparent_22%),radial-gradient(circle_at_50%_50%,rgba(20,184,166,.10),transparent_42%),linear-gradient(160deg,#020617,#0b1323_55%,#030712)]" />
      <Canvas className="relative h-full w-full">
        <PerspectiveCamera makeDefault position={[0, 5, 10]} />
        <OrbitControls enableZoom={false} enablePan={false} />
        
        {/* Lighting */}
        <ambientLight intensity={.42} />
        <pointLight position={[4, 7, 6]} intensity={2.2} color="#ffd36f" />
        <pointLight position={[-6, 2, 4]} intensity={1.15} color="#24d6ce" />
        <pointLight position={[0, -3, 2]} intensity={1.4} color="#f97316" />
        
        {/* Scene */}
        <TrishulModel />
        <EnergyHalo />
        <Particles />
        
        {/* Ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial color="#0a0a0f" />
        </mesh>
      </Canvas>

      {/* Cinematic impact layers make the required crash, flash and energy wave explicit. */}
      <AnimatePresence>
        {impact && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, .92, 0] }}
              transition={{ duration: .42 }}
              className="pointer-events-none absolute inset-0 bg-[#fff4c7] mix-blend-screen"
            />
            <motion.div
              initial={{ scale: 0, opacity: .9 }}
              animate={{ scale: 7, opacity: 0 }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300 shadow-[0_0_80px_24px_rgba(245,158,11,.65)]"
            />
            {[...Array(18)].map((_, index) => (
              <motion.span
                key={index}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: Math.cos((index / 18) * Math.PI * 2) * (110 + (index % 4) * 45),
                  y: Math.sin((index / 18) * Math.PI * 2) * (75 + (index % 3) * 42),
                  opacity: 0,
                  rotate: index * 45,
                }}
                transition={{ duration: .85, ease: 'easeOut' }}
                className="pointer-events-none absolute left-1/2 top-1/2 h-2 w-2 rounded-sm bg-amber-300 shadow-[0_0_12px_4px_rgba(251,191,36,.7)]"
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Text overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={reveal ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: .55 }}
          className="text-center"
        >
          <p className="mb-3 text-xs font-bold uppercase tracking-[.5em] text-teal-200">Customer relationship management</p>
          <h1 className="bg-gradient-to-b from-[#fff6d4] via-[#f5c76b] to-[#bf721b] bg-clip-text text-5xl font-black tracking-[.18em] text-transparent drop-shadow-[0_0_24px_rgba(251,191,36,.6)] sm:text-7xl">
            TRISHUL
          </h1>
          <p className="mt-3 text-[10px] font-semibold uppercase tracking-[.38em] text-slate-300">Command • Clarity • Growth</p>
          <div className="mx-auto mt-5 h-px w-44 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
        </motion.div>
      </div>
    </div>
  )
}

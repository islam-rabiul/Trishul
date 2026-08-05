'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Toast from './Toast'
import { usePathname, useRouter } from 'next/navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userRole, setUserRole] = useState('User')
  const [userName, setUserName] = useState('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const currentPage = pathname.split('/').filter(Boolean).at(-1) || 'dashboard'

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark'
    document.documentElement.dataset.theme = savedTheme
    document.documentElement.classList.toggle('dark', savedTheme === 'dark')

    const user = localStorage.getItem('user')
    if (!user) {
      router.push('/')
      return
    }

    try {
      const userData = JSON.parse(user)
      const role = userData.role || 'User'
      const protectedPages: Record<string, string[]> = {
        ai: ['Admin'],
        employees: ['Admin', 'Supervisor'],
        reports: ['Admin', 'Supervisor'],
        settings: ['Admin'],
      }
      const requestedPage = pathname.split('/').filter(Boolean).at(-1) || 'dashboard'
      if (protectedPages[requestedPage] && !protectedPages[requestedPage].includes(role)) {
        router.replace('/dashboard')
        return
      }
      setUserRole(role)
      setUserName(userData.name || '')
      const loginToast = localStorage.getItem('loginToast')
      if (loginToast) {
        setToastMessage(loginToast)
        localStorage.removeItem('loginToast')
      }
    } catch {
      localStorage.removeItem('user')
      router.push('/')
    }
  }, [pathname, router])

  return (
    <div className="min-h-screen bg-dark-bg">
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={() => undefined}
        userRole={userRole}
      />

      {/* Main content */}
      <motion.main
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen p-4 pt-20 sm:p-6 sm:pt-20 lg:ml-72 lg:p-8"
      >
        {/* Top bar */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white capitalize">
              {currentPage}
            </h1>
            <p className="text-gray-400 mt-1">
              Welcome back, {userName}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Realtime Active
            </div>

            <div className="glass px-4 py-2 rounded-lg">
              <span className="text-sm text-gray-400">Role:</span>
              <span className="ml-2 text-sm font-medium text-primary-400">{userRole}</span>
            </div>
          </div>
        </div>

        {/* Page content: each route eases in rather than switching abruptly. */}
        <AnimatePresence mode="wait">
          <motion.section
            key={pathname}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            {children}
          </motion.section>
        </AnimatePresence>
      </motion.main>
    </div>
  )
}

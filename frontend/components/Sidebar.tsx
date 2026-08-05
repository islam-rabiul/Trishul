'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  CheckSquare, 
  Briefcase, 
  BarChart3, 
  Bot, 
  Settings, 
  LogOut,
  Menu,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  currentPage: string
  onPageChange: (page: string) => void
  userRole: string
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Supervisor', 'User'] },
  { id: 'customers', label: 'Customers', icon: Users, roles: ['Admin', 'Supervisor', 'User'] },
  { id: 'leads', label: 'Leads', icon: Target, roles: ['Admin', 'Supervisor', 'User'] },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare, roles: ['Admin', 'Supervisor', 'User'] },
  { id: 'employees', label: 'Employees', icon: Briefcase, roles: ['Admin', 'Supervisor'] },
  { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'Supervisor'] },
  { id: 'ai', label: 'AI Assistant', icon: Bot, roles: ['Admin'] },
  { id: 'settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
]

export default function Sidebar({ currentPage, onPageChange, userRole }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/')
  }

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(userRole))

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-72 flex-col border-r border-dark-border bg-dark-surface transition-transform duration-200 ease-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-dark-border">
            <h1 className="text-2xl font-bold text-white">Trishul CRM</h1>
            <p className="mt-1 text-sm text-gray-400">Customer Management</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const Icon = item.icon
              const isActive = currentPage === item.id
              const targetHref = item.id === 'dashboard' ? '/dashboard' : `/dashboard/${item.id}`

              return (
                <Link
                  key={item.id}
                  href={targetHref}
                  prefetch={true}
                  onClick={() => {
                    onPageChange(item.id)
                    setIsMobileOpen(false)
                  }}
                  className="block w-full"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white glow font-semibold'
                        : 'text-gray-400 hover:bg-dark-border hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-dark-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation"
        aria-expanded={isMobileOpen}
        className="fixed left-4 top-4 z-30 rounded-lg border border-dark-border bg-dark-surface p-2 text-white shadow-lg lg:hidden"
      >
        <Menu className="w-6 h-6" />
      </button>
    </>
  )
}

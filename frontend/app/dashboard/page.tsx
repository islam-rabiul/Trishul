'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, Target, CheckSquare, IndianRupee, TrendingUp, Activity, FileText, Calendar, ArrowRight } from 'lucide-react'
import api from '@/lib/axios'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

import { useRealtime } from '@/hooks/useRealtime'

interface DashboardStats {
  totalCustomers: number
  totalLeads: number
  activeEmployees: number
  revenue: number
  pendingTasks: number
}

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  color: string
  trend?: string
  highlight?: boolean
}

function StatCard({ title, value, icon: Icon, color, trend, highlight }: StatCardProps) {
  const displayValue = typeof value === 'number' ? value.toLocaleString() : value
  const isLong = String(displayValue).length > 10
  const isMedium = String(displayValue).length > 6 && !isLong

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      className={`backdrop-blur-xl rounded-xl p-6 transition-all shadow-lg overflow-hidden relative ${
        highlight
          ? 'bg-gradient-to-br from-yellow-900/40 via-amber-900/30 to-gray-800/50 border-2 border-yellow-500/60 hover:border-yellow-400/80 shadow-yellow-900/30'
          : 'bg-gray-800/50 border border-gray-700 hover:border-blue-500/50'
      }`}
    >
      {highlight && (
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${highlight ? 'text-yellow-300/80' : 'text-gray-400'}`}>{title}</p>
          <motion.p
            key={String(displayValue)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className={`font-bold mt-2 break-all leading-tight ${
              highlight ? 'text-yellow-300' : 'text-white'
            } ${
              isLong ? 'text-xl' : isMedium ? 'text-2xl' : 'text-3xl'
            }`}
          >
            {displayValue}
          </motion.p>
          {trend && (
            <p className="text-sm mt-2 flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400">{trend}</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg shrink-0 ${color}`}>
          <Icon className={`w-6 h-6 ${highlight ? 'text-yellow-300' : 'text-white'}`} />
        </div>
      </div>
    </motion.div>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ElementType
  color: string
  onClick: () => void
}

function QuickAction({ title, description, icon: Icon, color, onClick }: QuickActionProps) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 text-left hover:border-blue-500/50 transition-all shadow-lg group"
    >
      <div className={`p-3 rounded-lg ${color} mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h4 className="text-lg font-semibold text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-400">{description}</p>
      <ArrowRight className="w-5 h-5 text-gray-400 mt-4 group-hover:text-blue-400 group-hover:translate-x-2 transition-all" />
    </motion.button>
  )
}

// Month abbreviation map for chart X-axis labels
const MONTH_ABBR = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function DashboardPage() {
  const router = useRouter()
  const [userRole, setUserRole] = useState<'Admin' | 'Supervisor' | 'User'>('User')
  // scope is always 'global' from the backend — all roles see company-wide totals.
  // We keep userRole only for quick-action links and chart/activity visibility.
  const [mounted, setMounted] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalLeads: 0,
    activeEmployees: 0,
    revenue: 0,
    pendingTasks: 0
  })
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  // Bug 7 fix: start with an empty array — real data is populated from the API
  const [chartData, setChartData] = useState<{ month: string; leads: number; customers: number }[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardStats = useCallback(async () => {
    try {
      const response = await api.get('/api/reports/dashboard')
      if (response.data.success) {
        const { stats: apiStats, trends, recentActivities: activities } = response.data.data

        setStats(apiStats)
        // scope is always 'global' — no per-role override needed

        if (activities) setRecentActivities(activities)

        // Bug 7 fix: build a merged chart dataset from real DB trend data.
        // Both monthlyLeads and monthlyCustomers use { _id: { year, month }, count }.
        if (trends?.monthlyLeads || trends?.monthlyCustomers) {
          // Collect all unique year-month keys present in either dataset
          const keyMap: Record<string, { leads: number; customers: number }> = {}

          ;(trends.monthlyLeads ?? []).forEach((item: { _id: { year: number; month: number }; count: number }) => {
            const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
            if (!keyMap[key]) keyMap[key] = { leads: 0, customers: 0 }
            keyMap[key].leads = item.count
          })

          ;(trends.monthlyCustomers ?? []).forEach((item: { _id: { year: number; month: number }; count: number }) => {
            const key = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`
            if (!keyMap[key]) keyMap[key] = { leads: 0, customers: 0 }
            keyMap[key].customers = item.count
          })

          const merged = Object.keys(keyMap)
            .sort()
            .map(key => {
              const [, monthStr] = key.split('-')
              return {
                month: MONTH_ABBR[parseInt(monthStr, 10)],
                leads: keyMap[key].leads,
                customers: keyMap[key].customers
              }
            })

          setChartData(merged)
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const role = JSON.parse(savedUser).role
      if (role === 'Admin' || role === 'Supervisor' || role === 'User') setUserRole(role)
    }
    fetchDashboardStats()
  }, [fetchDashboardStats])

  useRealtime(fetchDashboardStats)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const isAdmin = userRole === 'Admin'
  const isSupervisor = userRole === 'Supervisor'

  // All roles see identical company-wide summary cards.
  // Labels are always 'Total' — no 'My' or 'Team' prefix.
  const cards = [
    { title: 'Total Customers',  value: stats.totalCustomers,           icon: Users,        color: 'bg-blue-500/20' },
    { title: 'Total Leads',      value: stats.totalLeads,               icon: Target,       color: 'bg-purple-500/20' },
    { title: 'Active Employees', value: stats.activeEmployees,          icon: Activity,     color: 'bg-green-500/20' },
    { title: 'Total Revenue',    value: formatCurrency(stats.revenue),  icon: IndianRupee,  color: 'bg-yellow-500/30', highlight: true },
    { title: 'Pending Tasks',    value: stats.pendingTasks,             icon: CheckSquare,  color: 'bg-red-500/20' },
  ]

  const actions = isAdmin
    ? [
        { title: 'Add Customer', description: 'Create a customer profile', icon: Users, color: 'bg-blue-500/20', href: '/dashboard/customers' },
        { title: 'Create Lead', description: 'Add a lead to the pipeline', icon: Target, color: 'bg-purple-500/20', href: '/dashboard/leads' },
        { title: 'Manage Team', description: 'Add and manage employees', icon: Activity, color: 'bg-green-500/20', href: '/dashboard/employees' },
        { title: 'AI Assistant', description: 'Ask for CRM insights', icon: FileText, color: 'bg-yellow-500/20', href: '/dashboard/ai' },
      ]
    : isSupervisor
      ? [
          { title: 'Assign Leads', description: 'Distribute leads to your team', icon: Target, color: 'bg-purple-500/20', href: '/dashboard/leads' },
          { title: 'Team Tasks', description: 'Review team workload', icon: CheckSquare, color: 'bg-green-500/20', href: '/dashboard/tasks' },
          { title: 'View Customers', description: 'See customer details', icon: Users, color: 'bg-blue-500/20', href: '/dashboard/customers' },
          { title: 'Team Performance', description: 'Open team analytics', icon: FileText, color: 'bg-yellow-500/20', href: '/dashboard/reports' },
        ]
      : [
          { title: 'My Leads', description: 'Manage your assigned leads', icon: Target, color: 'bg-purple-500/20', href: '/dashboard/leads' },
          { title: 'My Tasks', description: 'Complete your daily tasks', icon: CheckSquare, color: 'bg-green-500/20', href: '/dashboard/tasks' },
          { title: 'View Customers', description: 'See customer details', icon: Users, color: 'bg-blue-500/20', href: '/dashboard/customers' },
        ]

  return (
    <div className="space-y-8">
      {/* Stats Grid — 5 cards, always global, same for every role */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        {cards.map(card => <StatCard key={card.title} {...card} />)}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-white mb-4">{isAdmin ? 'Administration' : isSupervisor ? 'Team Workspace' : 'My Workspace'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map(action => <QuickAction key={action.title} {...action} onClick={() => router.push(action.href)} />)}
        </div>
      </motion.div>

      {/* Charts Section — Admin & Supervisor */}
      {(isAdmin || isSupervisor) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Leads Trend (Line / Area Chart matching PDF) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 shadow-lg flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Monthly Leads</h3>
                <p className="text-xs text-gray-400">Pipeline acquisition trajectory</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                Line Chart
              </span>
            </div>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="leadsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#4b5563', borderRadius: '0.75rem', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)' }}
                      itemStyle={{ color: '#60a5fa', fontWeight: 600 }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="leads"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#leadsGradient)"
                      dot={{ r: 4, fill: '#60a5fa', strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          {/* Customer Growth (Bar Chart matching PDF) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 shadow-lg flex flex-col"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">Customer Growth</h3>
                <p className="text-xs text-gray-400">New customer onboarding per month</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Bar Chart
              </span>
            </div>
            <div className="h-64 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.5} />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#4b5563', borderRadius: '0.75rem', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)' }}
                      itemStyle={{ color: '#38bdf8', fontWeight: 600 }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    />
                    <Bar dataKey="customers" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Recent Activity — Admin & Supervisor */}
      {(isAdmin || isSupervisor) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Recent Activity</h3>
            <span className="text-xs text-gray-400 font-medium">Live Database Updates</span>
          </div>

          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No recent activity recorded yet.</p>
            ) : (
              recentActivities.map((activity, index) => (
                <motion.div
                  key={activity._id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-4 p-3.5 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition-all border border-gray-700/80 hover:border-gray-600"
                >
                  <div className={`w-3 h-3 rounded-full shrink-0 ${
                    activity.type === 'customer' ? 'bg-blue-500 shadow-sm shadow-blue-500/50' :
                    activity.type === 'lead' ? 'bg-purple-500 shadow-sm shadow-purple-500/50' : 'bg-green-500 shadow-sm shadow-green-500/50'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-gray-400 mt-0.5">by <span className="text-gray-300 font-medium">{activity.user}</span></p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0 font-mono">{formatDate(activity.createdAt)}</span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      )}
    </div>
  )
}

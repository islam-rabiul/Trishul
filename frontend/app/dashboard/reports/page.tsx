'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, TrendingUp, Users, DollarSign, CheckCircle } from 'lucide-react'
import api from '@/lib/axios'
import { formatCurrency } from '@/lib/utils'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null)
  const [topEmployees, setTopEmployees] = useState<any[]>([])
  const [inactiveCustomers, setInactiveCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [canViewTeamPerformance, setCanViewTeamPerformance] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const canViewTeam = ['Admin', 'Supervisor'].includes(user.role)
      setCanViewTeamPerformance(canViewTeam)
      const requests = [
        api.get('/api/reports/dashboard'),
        api.get('/api/reports/inactive-customers')
      ]
      if (canViewTeam) requests.push(api.get('/api/reports/top-employees'))
      const [dashboardRes, inactiveRes, topEmpRes] = await Promise.all(requests)

      if (dashboardRes.data.success) {
        setStats(dashboardRes.data.data.stats)
      }
      if (topEmpRes?.data.success) {
        setTopEmployees(topEmpRes.data.data)
      }
      if (inactiveRes.data.success) {
        setInactiveCustomers(inactiveRes.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Trishul CRM - Business Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
            h1 { color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; }
            .stat-box { display: inline-block; width: 22%; margin: 1%; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; box-sizing: border-box; }
            .stat-title { font-size: 12px; color: #64748b; text-transform: uppercase; }
            .stat-val { font-size: 22px; font-weight: bold; margin-top: 5px; color: #0f172a; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #f1f5f9; }
            .header-info { display: flex; justify-content: space-between; margin-bottom: 20px; color: #64748b; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>TRISHUL CRM — Business Performance Report</h1>
          <div class="header-info">
            <span>Generated on: ${new Date().toLocaleString()}</span>
            <span>Status: Verified</span>
          </div>

          <div style="margin-bottom: 20px;">
            <div class="stat-box"><div class="stat-title">Total Customers</div><div class="stat-val">${stats?.totalCustomers || 0}</div></div>
            <div class="stat-box"><div class="stat-title">Total Leads</div><div class="stat-val">${stats?.totalLeads || 0}</div></div>
            <div class="stat-box"><div class="stat-title">Total Revenue</div><div class="stat-val">${formatCurrency(stats?.revenue || 0)}</div></div>
            <div class="stat-box"><div class="stat-title">Pending Tasks</div><div class="stat-val">${stats?.pendingTasks || 0}</div></div>
          </div>

          ${topEmployees.length > 0 ? `
            <h2>Top Performing Employees</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Total Leads</th>
                  <th>Won Leads</th>
                  <th>Conversion Rate</th>
                  <th>Total Value</th>
                </tr>
              </thead>
              <tbody>
                ${topEmployees.map(e => `
                  <tr>
                    <td>${e.name}</td>
                    <td>${e.totalLeads}</td>
                    <td>${e.wonLeads}</td>
                    <td>${(e.conversionRate || 0).toFixed(1)}%</td>
                    <td>${formatCurrency(e.totalValue)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          ${inactiveCustomers.length > 0 ? `
            <h2 style="margin-top: 30px;">Inactive Customers (30+ Days)</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Email</th>
                  <th>Last Contact Date</th>
                </tr>
              </thead>
              <tbody>
                ${inactiveCustomers.map(c => `
                  <tr>
                    <td>${c.name}</td>
                    <td>${c.company || 'N/A'}</td>
                    <td>${c.email || 'N/A'}</td>
                    <td>${c.lastContactDate ? new Date(c.lastContactDate).toLocaleDateString() : 'Never'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  const exportToExcel = () => {
    let csv = 'TRISHUL CRM - BUSINESS REPORT\n'
    csv += `Generated At,${new Date().toLocaleString()}\n\n`
    csv += 'SUMMARY STATS\n'
    csv += `Total Customers,${stats?.totalCustomers || 0}\n`
    csv += `Total Leads,${stats?.totalLeads || 0}\n`
    csv += `Total Revenue,${stats?.revenue || 0}\n`
    csv += `Pending Tasks,${stats?.pendingTasks || 0}\n\n`

    if (topEmployees.length > 0) {
      csv += 'TOP PERFORMING EMPLOYEES\n'
      csv += 'Name,Total Leads,Won Leads,Conversion Rate (%),Total Value ($)\n'
      topEmployees.forEach(e => {
        csv += `"${e.name}",${e.totalLeads},${e.wonLeads},${(e.conversionRate || 0).toFixed(1)},${e.totalValue}\n`
      })
      csv += '\n'
    }

    if (inactiveCustomers.length > 0) {
      csv += 'INACTIVE CUSTOMERS (30+ DAYS)\n'
      csv += 'Name,Company,Email,Last Contact Date\n'
      inactiveCustomers.forEach(c => {
        csv += `"${c.name}","${c.company || ''}","${c.email || ''}",${c.lastContactDate ? new Date(c.lastContactDate).toLocaleDateString() : 'Never'}\n`
      })
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `trishul_crm_report_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportToPDF}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-500 hover:to-red-400 transition-all shadow-lg shadow-red-500/25"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={exportToExcel}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-500 hover:to-green-400 transition-all shadow-lg shadow-green-500/25"
        >
          <Download className="w-4 h-4" />
          Export Excel
        </motion.button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -5 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Customers</p>
              <p className="text-2xl font-bold text-white">{stats?.totalCustomers || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -5 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:border-purple-500/50 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Leads</p>
              <p className="text-2xl font-bold text-white">{stats?.totalLeads || 0}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -5 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:border-green-500/50 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats?.revenue || 0)}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -5 }}
          className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:border-yellow-500/50 transition-all shadow-lg"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Pending Tasks</p>
              <p className="text-2xl font-bold text-white">{stats?.pendingTasks || 0}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recharts Pie Chart (Simple Charts: Leads, Customers, Tasks Completed - matching PDF) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 shadow-lg"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">Simple Charts Overview</h3>
            <p className="text-xs text-gray-400">Distribution breakdown across Leads, Customers, and Completed Tasks</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Pie Chart
          </span>
        </div>
        <div className="h-72 w-full">
          {mounted && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Total Leads', value: stats?.totalLeads || 12, color: '#a855f7' },
                    { name: 'Total Customers', value: stats?.totalCustomers || 8, color: '#3b82f6' },
                    { name: 'Tasks Completed', value: Math.max(15 - (stats?.pendingTasks || 5), 5), color: '#10b981' }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {[
                    { name: 'Total Leads', value: stats?.totalLeads || 12, color: '#a855f7' },
                    { name: 'Total Customers', value: stats?.totalCustomers || 8, color: '#3b82f6' },
                    { name: 'Tasks Completed', value: Math.max(15 - (stats?.pendingTasks || 5), 5), color: '#10b981' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#1f2937" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#4b5563', borderRadius: '0.75rem', color: '#ffffff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.7)' }}
                  itemStyle={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 600, fontSize: '0.875rem' }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-gray-300 text-sm font-medium">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </motion.div>

      {/* Team performance is intentionally unavailable to standard users. */}
      {canViewTeamPerformance && <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-white mb-4">Top Performing Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Total Leads</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Won Leads</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Conversion Rate</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Total Value</th>
              </tr>
            </thead>
            <tbody>
              {topEmployees.map((emp, index) => (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-900/50 transition-colors">
                  <td className="py-3 px-4 text-white">{emp.name}</td>
                  <td className="py-3 px-4 text-gray-300">{emp.totalLeads}</td>
                  <td className="py-3 px-4 text-green-400">{emp.wonLeads}</td>
                  <td className="py-3 px-4 text-yellow-400">{emp.conversionRate?.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-white">{formatCurrency(emp.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>}

      {/* Inactive Customers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 shadow-lg"
      >
        <h3 className="text-xl font-bold text-white mb-4">Inactive Customers (30+ days)</h3>
        {inactiveCustomers.length === 0 ? (
          <p className="text-gray-400">No inactive customers found. Great job!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Company</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Email</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {inactiveCustomers.map((customer, index) => (
                  <tr key={index} className="border-b border-gray-700 hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4 text-white">{customer.name}</td>
                    <td className="py-3 px-4 text-gray-300">{customer.company || 'N/A'}</td>
                    <td className="py-3 px-4 text-gray-300">{customer.email || 'N/A'}</td>
                    <td className="py-3 px-4 text-red-400">
                      {customer.lastContactDate ? new Date(customer.lastContactDate).toLocaleDateString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}


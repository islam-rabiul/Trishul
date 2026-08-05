'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, DollarSign, X } from 'lucide-react'
import Portal from '@/components/Portal'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'

interface Lead {
  _id: string
  leadName: string
  phone: string
  email: string
  source: string
  status: 'New' | 'Contacted' | 'Interested' | 'Won' | 'Lost'
  assignedUser: { _id: string; name: string }
  estimatedValue: number
  followUpDate: string
  createdAt: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [userRole, setUserRole] = useState<'Admin' | 'Supervisor' | 'User'>('Admin')
  const [formData, setFormData] = useState({
    leadName: '',
    phone: '',
    email: '',
    source: 'Website',
    status: 'New' as Lead['status'],
    assignedUser: '',
    estimatedValue: 0,
    followUpDate: '',
    notes: ''
  })

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const role = JSON.parse(savedUser).role
      if (role === 'Admin' || role === 'Supervisor' || role === 'User') setUserRole(role)
      if (role !== 'User') fetchUsers()
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [searchTerm, statusFilter])

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      const response = await api.get(`/api/leads?${params}`)
      if (response.data.success) setLeads(response.data.data)
    } catch (error) {
      console.error('Failed to fetch leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/employees')
      if (response.data.success) setUsers(response.data.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const resetForm = () => {
    setFormData({ leadName: '', phone: '', email: '', source: 'Website', status: 'New', assignedUser: '', estimatedValue: 0, followUpDate: '', notes: '' })
    setEditingLead(null)
    setShowModal(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingLead) {
        await api.put(`/api/leads/${editingLead._id}`, formData)
      } else {
        await api.post('/api/leads', formData)
      }
      resetForm()
      fetchLeads()
    } catch (error) {
      console.error('Failed to save lead:', error)
    }
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      leadName: lead.leadName,
      phone: lead.phone,
      email: lead.email,
      source: lead.source,
      status: lead.status,
      assignedUser: lead.assignedUser?._id || '',
      estimatedValue: lead.estimatedValue,
      followUpDate: lead.followUpDate?.split('T')[0] || '',
      notes: ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      try {
        await api.delete(`/api/leads/${id}`)
        fetchLeads()
      } catch (error) {
        console.error('Failed to delete lead:', error)
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-500/20 text-blue-400'
      case 'Contacted': return 'bg-purple-500/20 text-purple-400'
      case 'Interested': return 'bg-yellow-500/20 text-yellow-400'
      case 'Won': return 'bg-green-500/20 text-green-400'
      case 'Lost': return 'bg-red-500/20 text-red-400'
      default: return 'bg-gray-500/20 text-gray-400'
    }
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
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm w-full sm:w-40"
          >
            <option value="">All Status</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        {/* Only Admin & Supervisor can add new leads */}
        {userRole !== 'User' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Add Lead
          </motion.button>
        )}
      </div>

      {/* Leads Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead, index) => (
          <motion.div
            key={lead._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{lead.leadName}</h3>
                <p className="text-sm text-gray-400 mt-1">Source: {lead.source}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {lead.estimatedValue > 0 && (
                <p className="text-sm flex items-center gap-1 text-green-400">
                  <DollarSign className="w-4 h-4" />
                  Est. Value: ${lead.estimatedValue.toLocaleString()}
                </p>
              )}
              {lead.assignedUser && (
                <p className="text-sm text-gray-400">Assigned: {lead.assignedUser.name}</p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <span className="text-xs text-gray-500">Added {formatDate(lead.createdAt)}</span>
              <div className="flex gap-2">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => handleEdit(lead)}
                  title={userRole === 'User' ? 'Update Lead Status' : 'Edit Lead'}
                  className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all">
                  <Edit className="w-4 h-4" />
                </motion.button>
                {/* Only Admin & Supervisor can delete leads */}
                {userRole !== 'User' && (
                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(lead._id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal — rendered in document.body via Portal */}
      {showModal && (
        <Portal>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={resetForm}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
              <h2 className="text-xl font-bold text-white">
                {editingLead ? 'Edit Lead' : 'Add New Lead'}
              </h2>
              <button type="button" onClick={resetForm}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                {/* User role: only Status + FollowUp; Admin/Supervisor: full form */}
                {userRole === 'User' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                      <select value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm">
                        <option value="New">New</option>
                        <option value="Contacted">Contacted</option>
                        <option value="Interested">Interested</option>
                        <option value="Won">Won</option>
                        <option value="Lost">Lost</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Follow-up Date</label>
                      <input type="date" value={formData.followUpDate}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Lead Name *</label>
                      <input type="text" required value={formData.leadName}
                        onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                        placeholder="Enter lead name"
                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                        <input type="email" value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                        <input type="tel" value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+1 234 567 890"
                          className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Source</label>
                        <select value={formData.source}
                          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm">
                          <option value="Website">Website</option>
                          <option value="Referral">Referral</option>
                          <option value="Advertisement">Advertisement</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Cold Call">Cold Call</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                        <select value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm">
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Interested">Interested</option>
                          <option value="Won">Won</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Assigned To</label>
                      <select value={formData.assignedUser}
                        onChange={(e) => setFormData({ ...formData, assignedUser: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm">
                        <option value="">Select User</option>
                        {users.map(user => (
                          <option key={user._id} value={user._id}>{user.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Estimated Value ($)</label>
                        <input type="number" value={formData.estimatedValue}
                          onChange={(e) => setFormData({ ...formData, estimatedValue: Number(e.target.value) })}
                          placeholder="0"
                          className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">Follow-up Date</label>
                        <input type="date" value={formData.followUpDate}
                          onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                          className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 px-6 py-4 border-t border-gray-700 shrink-0">
                <button type="button" onClick={resetForm}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-all text-sm font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 text-sm font-medium">
                  {editingLead ? 'Update Lead' : 'Add Lead'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
        </Portal>
      )}
    </div>
  )
}

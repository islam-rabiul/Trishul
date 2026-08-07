'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Edit, Trash2, IndianRupee, X, AlertCircle, Target } from 'lucide-react'
import Portal from '@/components/Portal'
import Toast from '@/components/Toast'
import api from '@/lib/axios'
import { formatDate, formatCurrency } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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
  notes: string
  createdAt: string
}

type UserRole = 'Admin' | 'Supervisor' | 'User'

interface FormData {
  leadName: string
  phone: string
  email: string
  source: string
  status: Lead['status']
  assignedUser: string
  estimatedValue: number
  followUpDate: string
  notes: string
}

interface FieldErrors {
  leadName?: string
  email?: string
  estimatedValue?: string
  assignedUser?: string
  [key: string]: string | undefined
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const EMPTY_FORM: FormData = {
  leadName: '',
  phone: '',
  email: '',
  source: 'Website',
  status: 'New',
  assignedUser: '',
  estimatedValue: 0,
  followUpDate: '',
  notes: ''
}

const SOURCES = ['Website', 'Referral', 'Advertisement', 'Social Media', 'Cold Call', 'Other']
const STATUSES: Lead['status'][] = ['New', 'Contacted', 'Interested', 'Won', 'Lost']

// ---------------------------------------------------------------------------
// Status colour helper
// ---------------------------------------------------------------------------
function getStatusColor(status: string) {
  const map: Record<string, string> = {
    New: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    Contacted: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    Interested: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    Won: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Lost: 'bg-red-500/20 text-red-400 border border-red-500/30',
  }
  return map[status] ?? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
}

// ---------------------------------------------------------------------------
// Inline field-error helper
// ---------------------------------------------------------------------------
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <p className="flex items-center gap-1 mt-1 text-xs text-red-400">
      <AlertCircle className="w-3 h-3 shrink-0" />
      {msg}
    </p>
  )
}

// ---------------------------------------------------------------------------
// Shared input class
// ---------------------------------------------------------------------------
const inputCls = (hasError?: boolean) =>
  `w-full px-4 py-2.5 bg-gray-900/60 border ${hasError ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20' : 'border-gray-700 focus:border-blue-500 focus:ring-blue-500/20'} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 transition-all text-sm`

// ---------------------------------------------------------------------------
// Client-side validation
// ---------------------------------------------------------------------------
function validate(data: FormData, role: UserRole, isEditing: boolean): FieldErrors {
  const errors: FieldErrors = {}

  if (!data.leadName.trim()) {
    errors.leadName = 'Lead name is required'
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  if (data.estimatedValue < 0) {
    errors.estimatedValue = 'Estimated value cannot be negative'
  }
  // Admin / Supervisor must pick an assignee; User is auto-assigned
  if (role !== 'User' && !data.assignedUser) {
    errors.assignedUser = 'Please assign this lead to a user'
  }
  return errors
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [userRole, setUserRole] = useState<UserRole>('User')
  const [currentUserId, setCurrentUserId] = useState('')
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [toast, setToast] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Initialise role from localStorage
  // -------------------------------------------------------------------------
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const parsed = JSON.parse(savedUser)
      const role: UserRole = parsed.role === 'Admin' || parsed.role === 'Supervisor' ? parsed.role : 'User'
      setUserRole(role)
      setCurrentUserId(parsed._id || parsed.id || '')
      if (role !== 'User') fetchUsers()
    }
  }, [])

  // -------------------------------------------------------------------------
  // Fetch leads whenever search / filter changes
  // -------------------------------------------------------------------------
  const fetchLeads = useCallback(async () => {
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
  }, [searchTerm, statusFilter])

  useEffect(() => { fetchLeads() }, [fetchLeads])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/employees')
      if (response.data.success) setUsers(response.data.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  // -------------------------------------------------------------------------
  // Modal helpers
  // -------------------------------------------------------------------------
  const openCreate = () => {
    setEditingLead(null)
    setFormData(EMPTY_FORM)
    setFieldErrors({})
    setShowModal(true)
  }

  const resetForm = () => {
    setShowModal(false)
    setEditingLead(null)
    setFormData(EMPTY_FORM)
    setFieldErrors({})
  }

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead)
    setFormData({
      leadName: lead.leadName,
      phone: lead.phone || '',
      email: lead.email || '',
      source: lead.source,
      status: lead.status,
      assignedUser: lead.assignedUser?._id || '',
      estimatedValue: lead.estimatedValue,
      followUpDate: lead.followUpDate?.split('T')[0] || '',
      notes: ''
    })
    setFieldErrors({})
    setShowModal(true)
  }

  // -------------------------------------------------------------------------
  // Form field change
  // -------------------------------------------------------------------------
  const handleChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear that field's error on user change
    if (fieldErrors[field]) setFieldErrors(prev => ({ ...prev, [field]: undefined }))
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation first
    const errors = validate(formData, userRole, !!editingLead)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setSubmitting(true)
    try {
      if (editingLead) {
        // Only Admin / Supervisor can reach the edit path
        await api.put(`/api/leads/${editingLead._id}`, formData)
        setToast('Lead updated successfully!')
      } else {
        // Create — backend auto-assigns for User role
        await api.post('/api/leads', formData)
        setToast('Lead created successfully! 🎉')
      }
      resetForm()
      fetchLeads()
    } catch (err: any) {
      const serverErrors = err?.response?.data?.errors
      if (serverErrors) {
        // Surface server-side field errors back into the form
        setFieldErrors(serverErrors)
      } else {
        setToast(err?.response?.data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      await api.delete(`/api/leads/${id}`)
      setToast('Lead deleted.')
      fetchLeads()
    } catch (error) {
      console.error('Failed to delete lead:', error)
    }
  }

  // -------------------------------------------------------------------------
  // Render helpers
  // -------------------------------------------------------------------------
  const isUser = userRole === 'User'
  const isEditing = !!editingLead
  // Users can create and edit their own leads; Admin/Supervisor manage all
  const modalTitle = isEditing ? 'Edit Lead' : isUser ? 'Submit New Lead' : 'Add New Lead'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Toast message={toast} onClose={() => setToast(null)} />

      {/* ------------------------------------------------------------------ */}
      {/* Search & Filter Bar                                                  */}
      {/* ------------------------------------------------------------------ */}
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
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Add Lead button — visible to ALL roles */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={openCreate}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 text-sm font-medium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </motion.button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Empty state                                                          */}
      {/* ------------------------------------------------------------------ */}
      {leads.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
            <Target className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">No leads yet</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs">
            {searchTerm || statusFilter
              ? 'No leads match your filters. Try adjusting the search.'
              : 'Create your first lead to start tracking your pipeline.'}
          </p>
          {!searchTerm && !statusFilter && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-4 h-4" />
              Create First Lead
            </motion.button>
          )}
        </motion.div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Leads Grid                                                           */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leads.map((lead, index) => (
          <motion.div
            key={lead._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -5 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all shadow-lg group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{lead.leadName}</h3>
                <p className="text-sm text-gray-400 mt-0.5">Source: {lead.source}</p>
              </div>
              <span className={`ml-2 shrink-0 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              {lead.email && (
                <p className="text-sm text-gray-400 truncate">{lead.email}</p>
              )}
              {lead.estimatedValue > 0 && (
                <p className="text-sm flex items-center gap-1 text-green-400">
                  <IndianRupee className="w-3.5 h-3.5 shrink-0" />
                  Est. Value: {formatCurrency(lead.estimatedValue)}
                </p>
              )}
              {lead.assignedUser && (
                <p className="text-sm text-gray-400">
                  Assigned: <span className="text-gray-300">{lead.assignedUser.name}</span>
                </p>
              )}
            </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <span className="text-xs text-gray-500">Added {formatDate(lead.createdAt)}</span>
              <div className="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                {/*
                  Admin/Supervisor can edit and delete any lead.
                  Users can edit and delete only leads assigned to themselves.
                  isInScope on the backend enforces the same ownership rule.
                */}
                {(!isUser || lead.assignedUser?._id === currentUserId) && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(lead)}
                      title="Edit Lead"
                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                    >
                      <Edit className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(lead._id)}
                      className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Modal                                                                */}
      {/* ------------------------------------------------------------------ */}
      {showModal && (
        <Portal>
          <AnimatePresence>
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
                exit={{ scale: 0.92, opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-white">{modalTitle}</h2>
                    {isUser && !isEditing && (
                      <p className="text-xs text-gray-400 mt-0.5">This lead will be assigned to you automatically</p>
                    )}
                  </div>
                  <button type="button" onClick={resetForm}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
                  <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

                    {/* --------------------------------------------------------
                        USER editing an existing lead: status + follow-up only
                     -------------------------------------------------------- */}
                    {isUser && isEditing && (
                      <>
                        {/* Read-only lead name as context */}
                        <div className="px-4 py-3 bg-gray-900/40 border border-gray-700 rounded-lg">
                          <p className="text-xs text-gray-400 mb-0.5">Lead</p>
                          <p className="text-sm font-semibold text-white">{editingLead?.leadName}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                          <select
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className={inputCls()}
                          >
                            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Follow-up Date</label>
                          <input
                            type="date"
                            value={formData.followUpDate}
                            onChange={(e) => handleChange('followUpDate', e.target.value)}
                            className={inputCls()}
                          />
                        </div>
                      </>
                    )}

                    {/* --------------------------------------------------------
                        USER creating a new lead — full form, auto-assigned
                     -------------------------------------------------------- */}
                    {isUser && !isEditing && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Lead Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.leadName}
                            onChange={(e) => handleChange('leadName', e.target.value)}
                            placeholder="e.g. Priya Sharma"
                            className={inputCls(!!fieldErrors.leadName)}
                          />
                          <FieldError msg={fieldErrors.leadName} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              placeholder="email@example.com"
                              className={inputCls(!!fieldErrors.email)}
                            />
                            <FieldError msg={fieldErrors.email} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              placeholder="+91 98765 43210"
                              className={inputCls()}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Source</label>
                            <select
                              value={formData.source}
                              onChange={(e) => handleChange('source', e.target.value)}
                              className={inputCls()}
                            >
                              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                            <select
                              value={formData.status}
                              onChange={(e) => handleChange('status', e.target.value as Lead['status'])}
                              className={inputCls()}
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Estimated Value (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={formData.estimatedValue}
                              onChange={(e) => handleChange('estimatedValue', Number(e.target.value))}
                              placeholder="0"
                              className={inputCls(!!fieldErrors.estimatedValue)}
                            />
                            <FieldError msg={fieldErrors.estimatedValue} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Follow-up Date</label>
                            <input
                              type="date"
                              value={formData.followUpDate}
                              onChange={(e) => handleChange('followUpDate', e.target.value)}
                              className={inputCls()}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Notes</label>
                          <textarea
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Any additional context about this lead..."
                            rows={3}
                            className={`${inputCls()} resize-none`}
                          />
                        </div>

                        {/* Visual cue: lead will be self-assigned */}
                        <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                          <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                          <p className="text-xs text-blue-300">
                            This lead will be automatically assigned to <span className="font-semibold">you</span>
                          </p>
                        </div>
                      </>
                    )}

                    {/* --------------------------------------------------------
                        ADMIN / SUPERVISOR — full form (create or edit)
                     -------------------------------------------------------- */}
                    {!isUser && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Lead Name <span className="text-red-400">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.leadName}
                            onChange={(e) => handleChange('leadName', e.target.value)}
                            placeholder="e.g. Priya Sharma"
                            className={inputCls(!!fieldErrors.leadName)}
                          />
                          <FieldError msg={fieldErrors.leadName} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
                            <input
                              type="email"
                              value={formData.email}
                              onChange={(e) => handleChange('email', e.target.value)}
                              placeholder="email@example.com"
                              className={inputCls(!!fieldErrors.email)}
                            />
                            <FieldError msg={fieldErrors.email} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone</label>
                            <input
                              type="tel"
                              value={formData.phone}
                              onChange={(e) => handleChange('phone', e.target.value)}
                              placeholder="+91 98765 43210"
                              className={inputCls()}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Source</label>
                            <select
                              value={formData.source}
                              onChange={(e) => handleChange('source', e.target.value)}
                              className={inputCls()}
                            >
                              {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Status</label>
                            <select
                              value={formData.status}
                              onChange={(e) => handleChange('status', e.target.value as Lead['status'])}
                              className={inputCls()}
                            >
                              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">
                            Assigned To <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={formData.assignedUser}
                            onChange={(e) => handleChange('assignedUser', e.target.value)}
                            className={inputCls(!!fieldErrors.assignedUser)}
                          >
                            <option value="">Select User</option>
                            {users.map(user => (
                              <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                          </select>
                          <FieldError msg={fieldErrors.assignedUser} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Estimated Value (₹)</label>
                            <input
                              type="number"
                              min={0}
                              value={formData.estimatedValue}
                              onChange={(e) => handleChange('estimatedValue', Number(e.target.value))}
                              placeholder="0"
                              className={inputCls(!!fieldErrors.estimatedValue)}
                            />
                            <FieldError msg={fieldErrors.estimatedValue} />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">Follow-up Date</label>
                            <input
                              type="date"
                              value={formData.followUpDate}
                              onChange={(e) => handleChange('followUpDate', e.target.value)}
                              className={inputCls()}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex gap-3 px-6 py-4 border-t border-gray-700 shrink-0">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-all text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      type="submit"
                      disabled={submitting}
                      whileHover={{ scale: submitting ? 1 : 1.01 }}
                      whileTap={{ scale: submitting ? 1 : 0.98 }}
                      className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {submitting && (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      )}
                      {submitting
                        ? (isEditing ? 'Updating…' : 'Creating…')
                        : (isEditing ? 'Update Lead' : 'Add Lead')}
                    </motion.button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </Portal>
      )}
    </div>
  )
}

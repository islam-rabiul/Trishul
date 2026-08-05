'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Search, Edit, Trash2, Calendar, CheckSquare,
  User, X, Clock, ShieldCheck, AlertTriangle, BadgeCheck,
  ClipboardList
} from 'lucide-react'
import Portal from '@/components/Portal'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import { useRealtime } from '@/hooks/useRealtime'

interface Task {
  _id: string
  title: string
  description: string
  assignedTo: { _id: string; name: string; role?: string }
  createdBy?: { _id: string; name: string }
  dueDate: string
  priority: 'Low' | 'Medium' | 'High'
  status: 'Pending' | 'Completed'
  completedAt?: string
  acknowledgedByAdmin: boolean
  acknowledgedAt?: string
  createdAt: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [users, setUsers] = useState<any[]>([])
  const [userRole, setUserRole] = useState<'Admin' | 'Supervisor' | 'User'>('User')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'Medium' as Task['priority'],
  })
  const [acknowledging, setAcknowledging] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const parsed = JSON.parse(savedUser)
      const role = parsed.role
      if (role === 'Admin' || role === 'Supervisor' || role === 'User') setUserRole(role)
      setCurrentUserId(parsed._id || parsed.id || '')
      if (role !== 'User') fetchUsers()
    }
  }, [])

  const fetchTasks = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (statusFilter) params.append('status', statusFilter)
      if (priorityFilter) params.append('priority', priorityFilter)

      const response = await api.get(`/api/tasks?${params}`)
      if (response.data.success) {
        setTasks(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, statusFilter, priorityFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])
  useRealtime(fetchTasks, ['task'])

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/employees')
      if (response.data.success) setUsers(response.data.data)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTask) {
        await api.put(`/api/tasks/${editingTask._id}`, formData)
      } else {
        await api.post('/api/tasks', formData)
      }
      closeModal()
      fetchTasks()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save task')
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingTask(null)
    setFormData({ title: '', description: '', assignedTo: '', dueDate: '', priority: 'Medium' })
  }

  const handleEdit = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || '',
      dueDate: task.dueDate?.split('T')[0] || '',
      priority: task.priority,
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await api.delete(`/api/tasks/${id}`)
        fetchTasks()
      } catch (error: any) {
        alert(error.response?.data?.message || 'Failed to delete task')
      }
    }
  }

  // User: marks task as Completed
  const handleMarkComplete = async (task: Task) => {
    if (task.status === 'Completed') return
    setCompleting(task._id)
    try {
      await api.put(`/api/tasks/${task._id}`, { status: 'Completed' })
      fetchTasks()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to mark task complete')
    } finally {
      setCompleting(null)
    }
  }

  // Admin/Supervisor: acknowledges a completed task
  const handleAcknowledge = async (task: Task) => {
    setAcknowledging(task._id)
    try {
      await api.put(`/api/tasks/${task._id}/acknowledge`)
      fetchTasks()
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to acknowledge task')
    } finally {
      setAcknowledging(null)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-red-500/20 text-red-400 border border-red-500/30'
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
      case 'Low': return 'bg-green-500/20 text-green-400 border border-green-500/30'
      default: return 'bg-gray-500/20 text-gray-400'
    }
  }

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'Pending' && new Date(dueDate) < new Date()
  }

  const isAdmin = userRole === 'Admin'
  const isSupervisor = userRole === 'Supervisor'
  const isUser = userRole === 'User'
  const canManage = isAdmin || isSupervisor

  // Split for User view: pending vs completed
  const myPendingTasks = isUser ? tasks.filter(t => t.status === 'Pending') : []
  const myCompletedTasks = isUser ? tasks.filter(t => t.status === 'Completed') : []

  // Admin view: pending acknowledgements first
  const pendingAck = canManage ? tasks.filter(t => t.status === 'Completed' && !t.acknowledgedByAdmin) : []
  const acknowledged = canManage ? tasks.filter(t => t.status === 'Completed' && t.acknowledgedByAdmin) : []
  const pendingTasks = canManage ? tasks.filter(t => t.status === 'Pending') : []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all text-sm w-full sm:w-36"
          >
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-all text-sm w-full sm:w-36"
          >
            <option value="">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Only Admin & Supervisor can create tasks */}
        {canManage && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 text-sm font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Assign Task
          </motion.button>
        )}
      </div>

      {/* ─────────────── USER VIEW ─────────────── */}
      {isUser && (
        <div className="space-y-8">
          {/* My Pending Tasks */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">My Assigned Tasks</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {myPendingTasks.length} pending
              </span>
            </div>

            {myPendingTasks.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No pending tasks — you're all caught up! 🎉</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPendingTasks.map((task, index) => (
                  <UserTaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    getPriorityColor={getPriorityColor}
                    isOverdue={isOverdue}
                    onComplete={() => handleMarkComplete(task)}
                    completing={completing === task._id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* My Completed Tasks */}
          {myCompletedTasks.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-white">Completed Tasks</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  {myCompletedTasks.length} done
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCompletedTasks.map((task, index) => (
                  <UserTaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    getPriorityColor={getPriorityColor}
                    isOverdue={isOverdue}
                    onComplete={() => {}}
                    completing={false}
                    done
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ─────────────── ADMIN / SUPERVISOR VIEW ─────────────── */}
      {canManage && (
        <div className="space-y-8">

          {/* Needs Acknowledgement — highlighted section */}
          {pendingAck.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Awaiting Your Acknowledgement</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  {pendingAck.length} completed
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingAck.map((task, index) => (
                  <AdminTaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    getPriorityColor={getPriorityColor}
                    isOverdue={isOverdue}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task._id)}
                    onAcknowledge={() => handleAcknowledge(task)}
                    acknowledging={acknowledging === task._id}
                    highlight
                  />
                ))}
              </div>
            </section>
          )}

          {/* Pending Tasks */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Pending Tasks</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {pendingTasks.length}
              </span>
            </div>
            {pendingTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-xl border border-gray-700">
                <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pending tasks</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingTasks.map((task, index) => (
                  <AdminTaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    getPriorityColor={getPriorityColor}
                    isOverdue={isOverdue}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task._id)}
                    onAcknowledge={null}
                    acknowledging={false}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Acknowledged / Done */}
          {acknowledged.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BadgeCheck className="w-5 h-5 text-green-400" />
                <h2 className="text-lg font-bold text-white">Acknowledged & Closed</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  {acknowledged.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acknowledged.map((task, index) => (
                  <AdminTaskCard
                    key={task._id}
                    task={task}
                    index={index}
                    getPriorityColor={getPriorityColor}
                    isOverdue={isOverdue}
                    onEdit={() => handleEdit(task)}
                    onDelete={() => handleDelete(task._id)}
                    onAcknowledge={null}
                    acknowledging={false}
                    acknowledged
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ─────────────── MODAL (Admin/Supervisor only) ─────────────── */}
      {showModal && canManage && (
        <Portal>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
                <h2 className="text-xl font-bold text-white">
                  {editingTask ? 'Edit Task' : 'Assign New Task'}
                </h2>
                <button type="button" onClick={closeModal} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Task Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Enter task title"
                      className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      placeholder="Describe what needs to be done..."
                      className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">Assign To *</label>
                    <select
                      required
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                    >
                      <option value="">Select Employee</option>
                      {users.map(user => (
                        <option key={user._id} value={user._id}>{user.name} — {user.role}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Due Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                        className="w-full px-4 py-2.5 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-sm"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-gray-700 shrink-0">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25 text-sm font-medium"
                  >
                    {editingTask ? 'Update Task' : 'Assign Task'}
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

/* ─── User Task Card ─── */
function UserTaskCard({ task, index, getPriorityColor, isOverdue, onComplete, completing, done }: any) {
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative bg-gray-800/50 backdrop-blur-xl border rounded-xl p-5 transition-all shadow-lg ${
        done
          ? 'border-green-500/30 opacity-60'
          : overdue
          ? 'border-red-500/40 hover:border-red-500/70'
          : 'border-gray-700 hover:border-blue-500/50'
      }`}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        {overdue && !done && (
          <span className="flex items-center gap-1 text-xs text-red-400 font-semibold">
            <AlertTriangle className="w-3 h-3" /> Overdue
          </span>
        )}
        {done && task.acknowledgedByAdmin && (
          <span className="flex items-center gap-1 text-xs text-green-400 font-semibold">
            <BadgeCheck className="w-3 h-3" /> Acknowledged
          </span>
        )}
        {done && !task.acknowledgedByAdmin && (
          <span className="text-xs text-amber-400 font-semibold">Pending Review</span>
        )}
      </div>

      <h3 className={`text-base font-bold mb-1 ${done ? 'line-through text-gray-500' : 'text-white'}`}>
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
        <Calendar className="w-3.5 h-3.5 text-blue-400" />
        Due: <span className={overdue && !done ? 'text-red-400 font-bold' : ''}>{formatDate(task.dueDate)}</span>
      </div>

      {task.createdBy && (
        <p className="text-xs text-gray-500 mb-3">Assigned by: {task.createdBy.name}</p>
      )}

      {/* Complete button (User only, for pending tasks) */}
      {!done && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onComplete}
          disabled={completing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-sm font-semibold transition-all disabled:opacity-60"
        >
          <CheckSquare className="w-4 h-4" />
          {completing ? 'Marking...' : 'Mark as Complete'}
        </motion.button>
      )}

      {done && (
        <div className="flex items-center gap-2 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 justify-center text-green-400 text-sm font-semibold">
          <CheckSquare className="w-4 h-4" />
          Completed {task.completedAt ? formatDate(task.completedAt) : ''}
        </div>
      )}
    </motion.div>
  )
}

/* ─── Admin Task Card ─── */
function AdminTaskCard({ task, index, getPriorityColor, isOverdue, onEdit, onDelete, onAcknowledge, acknowledging, highlight, acknowledged: isDone }: any) {
  const overdue = isOverdue(task.dueDate, task.status)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className={`relative bg-gray-800/50 backdrop-blur-xl border rounded-xl p-5 transition-all shadow-lg ${
        highlight
          ? 'border-amber-500/60 shadow-amber-900/20 bg-gradient-to-br from-amber-900/20 to-gray-800/50'
          : isDone
          ? 'border-green-500/30 opacity-70'
          : overdue
          ? 'border-red-500/40'
          : 'border-gray-700 hover:border-blue-500/50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
          {task.priority}
        </span>
        <div className="flex items-center gap-1.5">
          {overdue && task.status === 'Pending' && (
            <span className="text-xs text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Overdue
            </span>
          )}
          {highlight && (
            <span className="text-xs text-amber-400 font-bold">Needs Ack</span>
          )}
          {isDone && (
            <span className="text-xs text-green-400 font-bold flex items-center gap-1">
              <BadgeCheck className="w-3 h-3" /> Acknowledged
            </span>
          )}
          {/* Edit / Delete */}
          {!isDone && (
            <div className="flex gap-1 ml-1">
              <button onClick={onEdit} className="p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all">
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button onClick={onDelete} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <h3 className={`text-base font-bold mb-1 ${isDone ? 'line-through text-gray-500' : 'text-white'}`}>
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="space-y-1.5 mb-4">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <User className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-gray-300">{task.assignedTo?.name}</span>
          {task.assignedTo?.role && <span className="text-gray-600">· {task.assignedTo.role}</span>}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5 text-blue-400" />
          <span className={overdue && task.status === 'Pending' ? 'text-red-400 font-bold' : ''}>
            Due: {formatDate(task.dueDate)}
          </span>
        </div>
        {task.completedAt && (
          <div className="flex items-center gap-2 text-xs text-green-400">
            <CheckSquare className="w-3.5 h-3.5" />
            Completed: {formatDate(task.completedAt)}
          </div>
        )}
      </div>

      {/* Acknowledge button */}
      {onAcknowledge && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAcknowledge}
          disabled={acknowledging}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold transition-all disabled:opacity-60 shadow-lg shadow-amber-900/30"
        >
          <ShieldCheck className="w-4 h-4" />
          {acknowledging ? 'Acknowledging...' : 'Acknowledge Completion'}
        </motion.button>
      )}

      {isDone && (
        <div className="flex items-center gap-2 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 justify-center text-green-400 text-sm font-semibold">
          <BadgeCheck className="w-4 h-4" />
          Closed {task.acknowledgedAt ? formatDate(task.acknowledgedAt) : ''}
        </div>
      )}
    </motion.div>
  )
}

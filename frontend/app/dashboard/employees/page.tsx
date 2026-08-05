'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Edit, Trash2, Shield, User } from 'lucide-react'
import axios from 'axios'
import api from '@/lib/axios'
import { formatDate } from '@/lib/utils'
import Toast from '@/components/Toast'

interface Employee {
  _id: string
  name: string
  email: string
  role: 'Admin' | 'Supervisor' | 'User'
  supervisorId?: { _id: string; name: string }
  department: string
  phone: string
  createdAt: string
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<'Admin' | 'Supervisor' | 'User'>('User')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'User' as Employee['role'],
    supervisorId: '',
    department: '',
    phone: ''
  })

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      const role = JSON.parse(savedUser).role
      if (role === 'Admin' || role === 'Supervisor' || role === 'User') setUserRole(role)
    }
    fetchEmployees()
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [searchTerm, roleFilter])

  const fetchEmployees = async () => {
    try {
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (roleFilter) params.append('role', roleFilter)
      
      const response = await api.get(`/api/employees?${params}`)
      if (response.data.success) {
        setEmployees(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError('')
    setIsSaving(true)
    try {
      if (editingEmployee) {
        await api.put(`/api/employees/${editingEmployee._id}`, formData)
      } else {
        await api.post('/api/employees', formData)
        setToastMessage(`${formData.name} was added successfully.`)
      }
      setShowModal(false)
      setEditingEmployee(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'User',
        supervisorId: '',
        department: '',
        phone: ''
      })
      fetchEmployees()
    } catch (error) {
      console.error('Failed to save employee:', error)
      setSaveError(
        axios.isAxiosError(error)
          ? error.response?.data?.message || 'Unable to save the employee. Please try again.'
          : 'Unable to save the employee. Please try again.'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (employee: Employee) => {
    setSaveError('')
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      password: '',
      role: employee.role,
      supervisorId: employee.supervisorId?._id || '',
      department: employee.department,
      phone: employee.phone
    })
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/api/employees/${id}`)
        fetchEmployees()
      } catch (error) {
        console.error('Failed to delete employee:', error)
      }
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-500/20 text-purple-400'
      case 'Supervisor': return 'bg-blue-500/20 text-blue-400'
      case 'User': return 'bg-green-500/20 text-green-400'
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
      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="Supervisor">Supervisor</option>
            <option value="User">User</option>
          </select>
        </div>
        {/* Admin-only: Add Employee button */}
        {userRole === 'Admin' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setSaveError('')
              setEditingEmployee(null)
              setFormData({
                name: '',
                email: '',
                password: '',
                role: 'User',
                supervisorId: '',
                department: '',
                phone: ''
              })
              setShowModal(true)
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </motion.button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee, index) => (
          <motion.div
            key={employee._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -5 }}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition-all shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{employee.name}</h3>
                <p className="text-sm text-gray-400 mt-1">{employee.email}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                {employee.role}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              {employee.department && (
                <p className="text-sm text-gray-400">
                  Department: {employee.department}
                </p>
              )}
              {employee.supervisorId && (
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  Supervisor: {employee.supervisorId.name}
                </p>
              )}
              {employee.phone && (
                <p className="text-sm text-gray-400">
                  Phone: {employee.phone}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-700">
              <span className="text-xs text-gray-500">
                Added {formatDate(employee.createdAt)}
              </span>
              {/* Admin-only: Edit and Delete buttons */}
              {userRole === 'Admin' && (
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleEdit(employee)}
                    className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleDelete(employee._id)}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              )}
              {userRole === 'Supervisor' && (
                <span className="text-xs px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">View Only</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal — Admin only */}
      {showModal && userRole === 'Admin' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {saveError && (
                <div role="alert" className="rounded-lg border border-red-500/50 bg-red-500/15 p-3 text-sm text-red-300">
                  {saveError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              {!editingEmployee && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <p className="mt-1 text-xs text-gray-400">Use at least 6 characters.</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Role *</label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                >
                  <option value="User">User</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingEmployee(null)
                    setSaveError('')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg text-white hover:bg-gray-900 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-500/25"
                >
                  {isSaving ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

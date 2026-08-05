'use client'

import { useEffect } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface ToastProps {
  message: string | null
  onClose: () => void
}

export default function Toast({ message, onClose }: ToastProps) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onClose, 4500)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -18, scale: .96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: .96 }}
          role="status"
          className="fixed right-4 top-4 z-[100] flex max-w-md items-center gap-3 rounded-xl border border-teal-400/40 bg-slate-900 px-4 py-3 text-white shadow-2xl shadow-black/30"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-300" />
          <p className="text-sm font-medium text-white">{message}</p>
          <button onClick={onClose} aria-label="Dismiss notification" className="ml-2 rounded p-1 text-slate-300 hover:bg-white/10 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

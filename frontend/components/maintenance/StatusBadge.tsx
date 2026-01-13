import React from 'react'

interface StatusBadgeProps {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-blue-100 text-blue-800 border-blue-300'
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800 border-green-300'
    },
    cancelled: {
      label: 'Cancelled',
      className: 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const config = statusConfig[status] || statusConfig.pending

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      {config.label}
    </span>
  )
}

import React from 'react'
import { AlertCircle, AlertTriangle, Info, Zap } from 'lucide-react'

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent'
}

export default function PriorityBadge({ priority }: PriorityBadgeProps) {
  const priorityConfig = {
    low: {
      label: 'Low',
      className: 'bg-green-100 text-green-800 border-green-300',
      icon: Info
    },
    medium: {
      label: 'Medium',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: AlertCircle
    },
    high: {
      label: 'High',
      className: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: AlertTriangle
    },
    urgent: {
      label: 'Urgent',
      className: 'bg-red-100 text-red-800 border-red-300',
      icon: Zap
    }
  }

  const config = priorityConfig[priority] || priorityConfig.medium
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${config.className}`}>
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </span>
  )
}

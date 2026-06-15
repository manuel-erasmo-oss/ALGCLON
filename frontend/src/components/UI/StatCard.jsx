import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

export function StatCard({ title, value, icon: Icon, change, changeLabel, color = 'indigo', loading = false }) {
  const colorMap = {
    indigo: { bg: 'bg-indigo-50', icon: 'text-indigo-600', border: 'border-indigo-100' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', border: 'border-green-100' },
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', border: 'border-blue-100' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', border: 'border-orange-100' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', border: 'border-red-100' },
  }
  const colors = colorMap[color] || colorMap.indigo

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 bg-gray-200 rounded w-24" />
          <div className="w-10 h-10 bg-gray-200 rounded-lg" />
        </div>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && (
          <div className={`w-10 h-10 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${colors.icon}`} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      {(change !== undefined || changeLabel) && (
        <div className="flex items-center gap-1">
          {change !== undefined && (
            change >= 0
              ? <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              : <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          {changeLabel && (
            <span className="text-xs text-gray-500">{changeLabel}</span>
          )}
          {change !== undefined && (
            <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}

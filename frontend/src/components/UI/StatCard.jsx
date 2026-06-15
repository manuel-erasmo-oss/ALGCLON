import { TrendingUp, TrendingDown } from 'lucide-react'

export default function StatCard({ title, value, icon: Icon, change, changeLabel }) {
  const isPositive = change > 0
  const isNegative = change < 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {Icon && (
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Icon className="h-5 w-5 text-indigo-600" />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {change !== undefined && change !== null && (
        <div className="mt-2 flex items-center gap-1">
          {isPositive && <TrendingUp className="h-4 w-4 text-green-500" />}
          {isNegative && <TrendingDown className="h-4 w-4 text-red-500" />}
          <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {isPositive ? '+' : ''}{change}%
          </span>
          {changeLabel && <span className="text-sm text-gray-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}

const variantClasses = {
  // semantic
  success: 'bg-green-100 text-green-800 border-green-200',
  danger: 'bg-red-100 text-red-800 border-red-200',
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
  default: 'bg-gray-100 text-gray-700 border-gray-200',
  // colors
  green: 'bg-green-100 text-green-800 border-green-200',
  red: 'bg-red-100 text-red-800 border-red-200',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  gray: 'bg-gray-100 text-gray-700 border-gray-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  // invoice status
  paid: 'bg-green-100 text-green-800 border-green-200',
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  sent: 'bg-blue-100 text-blue-800 border-blue-200',
  overdue: 'bg-red-100 text-red-800 border-red-200',
  cancelled: 'bg-gray-200 text-gray-600 border-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  // contact types
  client: 'bg-blue-100 text-blue-800 border-blue-200',
  supplier: 'bg-green-100 text-green-800 border-green-200',
  both: 'bg-indigo-100 text-indigo-800 border-indigo-200',
}

export function Badge({ variant = 'default', children, className = '' }) {
  const classes = variantClasses[variant] || variantClasses.default
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${classes} ${className}`}>
      {children}
    </span>
  )
}

export default Badge

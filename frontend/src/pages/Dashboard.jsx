import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { DollarSign, FileText, Users, AlertCircle, Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getDashboardStats } from '../api/reports'
import StatCard from '../components/UI/StatCard'
import Card from '../components/UI/Card'
import Table from '../components/UI/Table'
import Badge from '../components/UI/Badge'
import LoadingSpinner from '../components/UI/LoadingSpinner'
import { Button } from '../components/UI/Button'
import { formatCOP, formatDate } from '../utils/format'

const STATUS_VARIANTS = {
  DRAFT: 'default',
  SENT: 'info',
  PAID: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'default',
}

const STATUS_LABELS = {
  DRAFT: 'Borrador',
  SENT: 'Enviada',
  PAID: 'Pagada',
  OVERDUE: 'Vencida',
  CANCELLED: 'Cancelada',
}

const MOCK_MONTHLY = [
  { month: 'Ene', total: 1200000 },
  { month: 'Feb', total: 1900000 },
  { month: 'Mar', total: 1500000 },
  { month: 'Abr', total: 2200000 },
  { month: 'May', total: 1800000 },
  { month: 'Jun', total: 2700000 },
]

export default function Dashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        Error al cargar el dashboard
      </div>
    )
  }

  const stats = data || {}
  const monthlyData = stats.monthlyIncome?.length ? stats.monthlyIncome : MOCK_MONTHLY
  const recentInvoices = stats.recentInvoices || []

  const invoiceColumns = [
    { key: 'number', label: '# Factura' },
    { key: 'contact', label: 'Cliente', render: (v) => v?.name || v || '-' },
    { key: 'issue_date', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'total', label: 'Total', render: (v) => formatCOP(v) },
    {
      key: 'status',
      label: 'Estado',
      render: (v) => <Badge variant={STATUS_VARIANTS[v] || 'default'}>{STATUS_LABELS[v] || v}</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex items-center justify-between">
        <div />
        <div className="flex gap-3">
          <Link to="/invoices/new">
            <Button variant="primary" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nueva Factura
            </Button>
          </Link>
          <Link to="/contacts">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Contacto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Ingresos"
          value={formatCOP(stats.totalIncome)}
          icon={DollarSign}
          change={stats.incomeChange}
          changeLabel="vs mes anterior"
        />
        <StatCard
          title="Facturas Pendientes"
          value={stats.pendingInvoices ?? 0}
          icon={FileText}
          change={stats.pendingChange}
        />
        <StatCard
          title="Clientes Activos"
          value={stats.activeContacts ?? 0}
          icon={Users}
          change={stats.contactsChange}
        />
        <StatCard
          title="Por Cobrar"
          value={formatCOP(stats.receivables)}
          icon={AlertCircle}
          change={stats.receivablesChange}
        />
      </div>

      {/* Charts + Recent invoices */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card title="Ingresos mensuales">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
              />
              <Tooltip formatter={(v) => formatCOP(v)} />
              <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Últimas facturas">
          <Table columns={invoiceColumns} data={recentInvoices.slice(0, 5)} />
        </Card>
      </div>
    </div>
  )
}

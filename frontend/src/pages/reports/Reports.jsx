import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { getDashboardStats, getIncomeStatement, getBalanceSheet, getReceivables } from '../../api/reports'
import { Card } from '../../components/UI/Card'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'
import { formatCOP } from '../../utils/format'

const TABS = [
  { key: 'dashboard', label: 'Dashboard Financiero' },
  { key: 'income', label: 'Estado de Resultados' },
  { key: 'balance', label: 'Balance General' },
  { key: 'receivables', label: 'Cuentas por Cobrar' },
]

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const mockMonthlyData = [
  { month: 'Ene', ingresos: 4500000, gastos: 2100000 },
  { month: 'Feb', ingresos: 5200000, gastos: 2400000 },
  { month: 'Mar', ingresos: 3800000, gastos: 1900000 },
  { month: 'Abr', ingresos: 6100000, gastos: 2800000 },
  { month: 'May', ingresos: 7400000, gastos: 3100000 },
  { month: 'Jun', ingresos: 5900000, gastos: 2600000 },
]

function DateRangePicker({ dateFrom, setDateFrom, dateTo, setDateTo }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 whitespace-nowrap">Desde:</label>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500 whitespace-nowrap">Hasta:</label>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  )
}

function KPICard({ title, value, icon: Icon, color = 'indigo' }) {
  const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  }
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function DashboardTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    retry: false,
  })

  const s = stats?.data || stats || {}
  const chartData = s.chartData || mockMonthlyData

  const pieData = [
    { name: 'Pagadas', value: s.totalCollected || 0 },
    { name: 'Por cobrar', value: s.totalReceivable || 0 },
    { name: 'Vencidas', value: s.totalOverdue || 0 },
  ].filter(d => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard title="Total Facturado (mes)" value={formatCOP(s.totalInvoiced || 0)} icon={TrendingUp} color="indigo" />
        <KPICard title="Total Cobrado" value={formatCOP(s.totalCollected || 0)} icon={CheckCircle2} color="green" />
        <KPICard title="Por Cobrar" value={formatCOP(s.totalReceivable || 0)} icon={Clock} color="yellow" />
        <KPICard title="Vencido" value={formatCOP(s.totalOverdue || 0)} icon={AlertCircle} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Ingresos vs Gastos - Últimos 6 meses" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(v) => new Intl.NumberFormat('es-CO', { notation: 'compact' }).format(v)} />
                <Tooltip formatter={(value) => [formatCOP(value)]} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} name="Ingresos" />
                <Bar dataKey="gastos" fill="#f87171" radius={[4, 4, 0, 0]} name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Distribución Cobros">
          {pieData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    paddingAngle={3} dataKey="value">
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatCOP(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center">
              <p className="text-gray-400 text-sm">Sin datos disponibles</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

function IncomeTab({ dateFrom, dateTo }) {
  const { data, isLoading } = useQuery({
    queryKey: ['income-statement', dateFrom, dateTo],
    queryFn: () => getIncomeStatement({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    retry: false,
  })

  const report = data?.data || data || {}
  const income = report.income || []
  const expenses = report.expenses || []
  const totalIncome = income.reduce((s, r) => s + (r.amount || 0), 0)
  const totalExpenses = expenses.reduce((s, r) => s + (r.amount || 0), 0)
  const netIncome = totalIncome - totalExpenses

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm text-green-700 font-medium mb-1">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-800">{formatCOP(totalIncome)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-700 font-medium mb-1">Total Gastos</p>
          <p className="text-2xl font-bold text-red-800">{formatCOP(totalExpenses)}</p>
        </div>
        <div className={`${netIncome >= 0 ? 'bg-indigo-50 border-indigo-200' : 'bg-red-50 border-red-200'} border rounded-xl p-5`}>
          <p className="text-sm font-medium mb-1 text-gray-700">Utilidad Neta</p>
          <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-indigo-800' : 'text-red-800'}`}>
            {formatCOP(netIncome)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-green-50 border-b border-green-100">
            <h3 className="font-semibold text-green-800">Ingresos</h3>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cuenta</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {income.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-8 text-gray-400 text-sm">Sin datos</td></tr>
              ) : income.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{row.account || row.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-green-700 text-right">{formatCOP(row.amount)}</td>
                </tr>
              ))}
              <tr className="bg-green-50 font-semibold border-t-2 border-green-200">
                <td className="px-4 py-3 text-sm text-green-800">Total Ingresos</td>
                <td className="px-4 py-3 text-sm text-green-800 text-right">{formatCOP(totalIncome)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Expenses */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-red-50 border-b border-red-100">
            <h3 className="font-semibold text-red-800">Gastos</h3>
          </div>
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cuenta</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.length === 0 ? (
                <tr><td colSpan={2} className="text-center py-8 text-gray-400 text-sm">Sin datos</td></tr>
              ) : expenses.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{row.account || row.name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-red-700 text-right">{formatCOP(row.amount)}</td>
                </tr>
              ))}
              <tr className="bg-red-50 font-semibold border-t-2 border-red-200">
                <td className="px-4 py-3 text-sm text-red-800">Total Gastos</td>
                <td className="px-4 py-3 text-sm text-red-800 text-right">{formatCOP(totalExpenses)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BalanceTab({ dateFrom, dateTo }) {
  const { data, isLoading } = useQuery({
    queryKey: ['balance-sheet', dateFrom, dateTo],
    queryFn: () => getBalanceSheet({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    retry: false,
  })

  const report = data?.data || data || {}
  const assets = report.assets || []
  const liabilities = report.liabilities || []
  const equity = report.equity || []
  const totalAssets = assets.reduce((s, r) => s + (r.amount || 0), 0)
  const totalLiabilities = liabilities.reduce((s, r) => s + (r.amount || 0), 0)
  const totalEquity = equity.reduce((s, r) => s + (r.amount || 0), 0)

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  const Section = ({ title, rows, total, totalLabel, headerColor }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className={`px-6 py-4 ${headerColor} border-b`}>
        <h3 className="font-semibold">{title}</h3>
      </div>
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cuenta</th>
            <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Saldo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.length === 0 ? (
            <tr><td colSpan={2} className="text-center py-8 text-gray-400 text-sm">Sin datos</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-700">{row.account || row.name}</td>
              <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatCOP(row.amount)}</td>
            </tr>
          ))}
          <tr className="bg-gray-100 font-semibold border-t-2 border-gray-200">
            <td className="px-4 py-3 text-sm text-gray-800">{totalLabel}</td>
            <td className="px-4 py-3 text-sm text-gray-800 text-right">{formatCOP(total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-sm text-blue-700 font-medium mb-1">Total Activos</p>
          <p className="text-2xl font-bold text-blue-800">{formatCOP(totalAssets)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm text-red-700 font-medium mb-1">Total Pasivos</p>
          <p className="text-2xl font-bold text-red-800">{formatCOP(totalLiabilities)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="text-sm text-green-700 font-medium mb-1">Patrimonio</p>
          <p className="text-2xl font-bold text-green-800">{formatCOP(totalEquity)}</p>
        </div>
      </div>
      <Section title="Activos" rows={assets} total={totalAssets} totalLabel="Total Activos" headerColor="bg-blue-50 text-blue-800 border-blue-100" />
      <Section title="Pasivos" rows={liabilities} total={totalLiabilities} totalLabel="Total Pasivos" headerColor="bg-red-50 text-red-800 border-red-100" />
      <Section title="Patrimonio" rows={equity} total={totalEquity} totalLabel="Total Patrimonio" headerColor="bg-green-50 text-green-800 border-green-100" />
    </div>
  )
}

function ReceivablesTab() {
  const { data, isLoading } = useQuery({
    queryKey: ['receivables'],
    queryFn: getReceivables,
    retry: false,
  })

  const report = data?.data || data || {}
  const aging = report.aging || []
  const summary = report.summary || {}

  if (isLoading) return <div className="flex justify-center py-12"><LoadingSpinner /></div>

  const agingBuckets = [
    { label: 'Corriente (0-30 días)', key: 'current', color: 'text-green-700 bg-green-50' },
    { label: '31-60 días', key: 'days31to60', color: 'text-yellow-700 bg-yellow-50' },
    { label: '61-90 días', key: 'days61to90', color: 'text-orange-700 bg-orange-50' },
    { label: 'Más de 90 días', key: 'over90', color: 'text-red-700 bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      {/* Aging Buckets Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {agingBuckets.map((bucket) => (
          <div key={bucket.key} className={`rounded-xl border p-5 ${bucket.color}`}>
            <p className="text-sm font-medium mb-1">{bucket.label}</p>
            <p className="text-2xl font-bold">{formatCOP(summary[bucket.key] || 0)}</p>
          </div>
        ))}
      </div>

      {/* Aging Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Detalle por Cliente</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cliente</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">0-30 días</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">31-60 días</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">61-90 días</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">+90 días</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {aging.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Sin cuentas por cobrar
                  </td>
                </tr>
              ) : aging.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.contact || row.name}</td>
                  <td className="px-4 py-3 text-sm text-green-700 text-right">{formatCOP(row.current || 0)}</td>
                  <td className="px-4 py-3 text-sm text-yellow-700 text-right">{formatCOP(row.days31to60 || 0)}</td>
                  <td className="px-4 py-3 text-sm text-orange-700 text-right">{formatCOP(row.days61to90 || 0)}</td>
                  <td className="px-4 py-3 text-sm text-red-700 text-right">{formatCOP(row.over90 || 0)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-right">{formatCOP(row.total || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const showDateFilter = activeTab !== 'dashboard' && activeTab !== 'receivables'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reportes</h2>
          <p className="text-sm text-gray-500">Análisis financiero de tu empresa</p>
        </div>
        {showDateFilter && (
          <DateRangePicker dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} />
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-6">
          {activeTab === 'dashboard' && <DashboardTab />}
          {activeTab === 'income' && <IncomeTab dateFrom={dateFrom} dateTo={dateTo} />}
          {activeTab === 'balance' && <BalanceTab dateFrom={dateFrom} dateTo={dateTo} />}
          {activeTab === 'receivables' && <ReceivablesTab />}
        </div>
      </div>
    </div>
  )
}

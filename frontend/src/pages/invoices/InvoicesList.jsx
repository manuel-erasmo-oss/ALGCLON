import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Plus, Eye, Edit, Send, CheckCircle, XCircle } from 'lucide-react'
import { getInvoices, sendInvoice, markAsPaid, cancelInvoice } from '../../api/invoices'
import { useToast } from '../../contexts/ToastContext'
import Table from '../../components/UI/Table'
import Pagination from '../../components/UI/Pagination'
import Badge from '../../components/UI/Badge'
import Card from '../../components/UI/Card'
import { Button } from '../../components/UI/Button'
import { formatCOP, formatDate } from '../../utils/format'

const STATUS_TABS = [
  { label: 'Todas', value: '' },
  { label: 'Borrador', value: 'DRAFT' },
  { label: 'Enviadas', value: 'SENT' },
  { label: 'Pagadas', value: 'PAID' },
  { label: 'Vencidas', value: 'OVERDUE' },
  { label: 'Canceladas', value: 'CANCELLED' },
]

const STATUS_VARIANTS = {
  DRAFT: 'default', SENT: 'info', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'default',
}
const STATUS_LABELS = {
  DRAFT: 'Borrador', SENT: 'Enviada', PAID: 'Pagada', OVERDUE: 'Vencida', CANCELLED: 'Cancelada',
}

export default function InvoicesList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const params = { page, status: statusFilter, dateFrom, dateTo }

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', params],
    queryFn: () => getInvoices(params),
  })

  const invoices = data?.data || data?.invoices || data || []
  const totalPages = data?.totalPages || data?.meta?.totalPages || 1

  const sendMutation = useMutation({
    mutationFn: sendInvoice,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); showSuccess('Factura enviada') },
    onError: (e) => showError(e?.response?.data?.message || 'Error al enviar'),
  })

  const paidMutation = useMutation({
    mutationFn: markAsPaid,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); showSuccess('Factura marcada como pagada') },
    onError: (e) => showError(e?.response?.data?.message || 'Error'),
  })

  const cancelMutation = useMutation({
    mutationFn: cancelInvoice,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['invoices'] }); showSuccess('Factura cancelada') },
    onError: (e) => showError(e?.response?.data?.message || 'Error al cancelar'),
  })

  const columns = [
    { key: 'number', label: '# Factura', render: (v) => v || '-' },
    { key: 'contact', label: 'Cliente', render: (v) => v?.name || v || '-' },
    { key: 'issue_date', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'due_date', label: 'Vencimiento', render: (v) => formatDate(v) },
    { key: 'total', label: 'Total', render: (v) => formatCOP(v) },
    {
      key: 'status',
      label: 'Estado',
      render: (v) => <Badge variant={STATUS_VARIANTS[v] || 'default'}>{STATUS_LABELS[v] || v}</Badge>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${row.id}`) }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded" title="Ver">
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'DRAFT' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${row.id}/edit`) }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded" title="Editar">
                <Edit className="h-4 w-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); sendMutation.mutate(row.id) }} className="p-1.5 text-gray-400 hover:text-blue-600 rounded" title="Enviar">
                <Send className="h-4 w-4" />
              </button>
            </>
          )}
          {row.status === 'SENT' && (
            <>
              <button onClick={(e) => { e.stopPropagation(); paidMutation.mutate(row.id) }} className="p-1.5 text-gray-400 hover:text-green-600 rounded" title="Marcar Pagada">
                <CheckCircle className="h-4 w-4" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); cancelMutation.mutate(row.id) }} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Cancelar">
                <XCircle className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="primary" size="sm" onClick={() => navigate('/invoices/new')}>
          <Plus className="h-4 w-4 mr-1" />
          Nueva Factura
        </Button>
      </div>

      <Card>
        {/* Date filters */}
        <div className="flex gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Desde</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium block mb-1">Hasta</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1) }}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                statusFilter === tab.value ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Table columns={columns} data={Array.isArray(invoices) ? invoices : []} loading={isLoading} />
        <div className="border-t border-gray-200 mt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>
    </div>
  )
}

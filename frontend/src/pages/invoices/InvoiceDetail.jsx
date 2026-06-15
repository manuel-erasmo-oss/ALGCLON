import React from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Printer, Send, CheckCircle, XCircle, FileText } from 'lucide-react'
import { getInvoice, sendInvoice, markAsPaid, cancelInvoice, deleteInvoice } from '../../api/invoices'
import { getSettings } from '../../api/settings'
import { useToast } from '../../contexts/ToastContext'
import { Badge } from '../../components/UI/Badge'
import { Button } from '../../components/UI/Button'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'
import { Modal } from '../../components/UI/Modal'
import { formatCOP, formatDate } from '../../utils/format'
import { useState } from 'react'

const statusVariant = {
  draft: 'gray',
  sent: 'blue',
  paid: 'green',
  overdue: 'red',
  cancelled: 'gray',
}

const statusLabel = {
  draft: 'Borrador',
  sent: 'Enviada',
  paid: 'Pagada',
  overdue: 'Vencida',
  cancelled: 'Cancelada',
}

const typeLabel = {
  invoice: 'FACTURA',
  quote: 'COTIZACIÓN',
  credit_note: 'NOTA CRÉDITO',
}

export default function InvoiceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const [confirmAction, setConfirmAction] = useState(null)

  const { data: invoiceRaw, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => getInvoice(id),
  })

  const { data: settingsRaw } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const invoice = invoiceRaw?.data || invoiceRaw
  const settings = settingsRaw?.data || settingsRaw

  const sendMutation = useMutation({
    mutationFn: () => sendInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      showSuccess('Factura enviada exitosamente')
      setConfirmAction(null)
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al enviar factura'),
  })

  const paidMutation = useMutation({
    mutationFn: () => markAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      showSuccess('Factura marcada como pagada')
      setConfirmAction(null)
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al marcar como pagada'),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      showSuccess('Factura cancelada')
      setConfirmAction(null)
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al cancelar factura'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      showSuccess('Factura eliminada')
      navigate('/invoices')
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al eliminar factura'),
  })

  const handleConfirmAction = () => {
    if (confirmAction === 'send') sendMutation.mutate()
    else if (confirmAction === 'paid') paidMutation.mutate()
    else if (confirmAction === 'cancel') cancelMutation.mutate()
    else if (confirmAction === 'delete') deleteMutation.mutate()
  }

  const isActionLoading =
    sendMutation.isPending || paidMutation.isPending || cancelMutation.isPending || deleteMutation.isPending

  const actionLabels = {
    send: 'enviar',
    paid: 'marcar como pagada',
    cancel: 'cancelar',
    delete: 'eliminar',
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Factura no encontrada</p>
        <Link to="/invoices" className="text-indigo-600 hover:underline mt-2 block">Volver a facturas</Link>
      </div>
    )
  }

  const items = invoice.items || []
  const subtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0)
    const price = parseFloat(item.price || 0)
    const discount = parseFloat(item.discount || 0)
    return sum + qty * price * (1 - discount / 100)
  }, 0)
  const totalIVA = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0)
    const price = parseFloat(item.price || 0)
    const discount = parseFloat(item.discount || 0)
    const tax = parseFloat(item.tax || 0)
    const lineTotal = qty * price * (1 - discount / 100)
    return sum + lineTotal * (tax / 100)
  }, 0)
  const total = invoice.total ?? subtotal + totalIVA

  const contact = invoice.contact || {}
  const company = settings?.company || {}

  return (
    <div className="space-y-4">
      {/* Top Bar - Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {typeLabel[invoice.type] || 'FACTURA'} #{invoice.number || invoice.id}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={statusVariant[invoice.status] || 'gray'}>
                {statusLabel[invoice.status] || invoice.status}
              </Badge>
              <span className="text-sm text-gray-500">{formatDate(invoice.date)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Imprimir
          </Button>
          {invoice.status === 'draft' && (
            <>
              <Link to={`/invoices/${id}/edit`}>
                <Button variant="outline" size="sm">
                  <Pencil className="w-4 h-4" />
                  Editar
                </Button>
              </Link>
              <Button size="sm" onClick={() => setConfirmAction('send')}>
                <Send className="w-4 h-4" />
                Enviar
              </Button>
              <Button variant="danger" size="sm" onClick={() => setConfirmAction('delete')}>
                Eliminar
              </Button>
            </>
          )}
          {invoice.status === 'sent' && (
            <>
              <Button size="sm" onClick={() => setConfirmAction('paid')}>
                <CheckCircle className="w-4 h-4" />
                Marcar Pagada
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirmAction('cancel')}>
                <XCircle className="w-4 h-4" />
                Cancelar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Invoice Document */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 print:shadow-none print:border-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-indigo-900">
                {company.name || 'Mi Empresa'}
              </span>
            </div>
            {company.nit && <p className="text-sm text-gray-500">NIT: {company.nit}</p>}
            {company.address && <p className="text-sm text-gray-500">{company.address}</p>}
            {company.phone && <p className="text-sm text-gray-500">Tel: {company.phone}</p>}
            {company.email && <p className="text-sm text-gray-500">{company.email}</p>}
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-800 mb-1">
              {typeLabel[invoice.type] || 'FACTURA'}
            </h1>
            <p className="text-xl font-semibold text-indigo-600">#{invoice.number || invoice.id}</p>
            <div className="mt-2">
              <Badge variant={statusVariant[invoice.status] || 'gray'} className="text-sm px-3 py-1">
                {statusLabel[invoice.status] || invoice.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Info Row */}
        <div className="grid grid-cols-2 gap-8 mb-8 p-5 bg-gray-50 rounded-xl">
          {/* Client Info */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Facturado a</p>
            <p className="font-semibold text-gray-900 text-lg">{contact.name || invoice.contactName || '—'}</p>
            {contact.identificationNumber && (
              <p className="text-sm text-gray-600">{contact.identificationType}: {contact.identificationNumber}</p>
            )}
            {contact.email && <p className="text-sm text-gray-600">{contact.email}</p>}
            {contact.phone && <p className="text-sm text-gray-600">{contact.phone}</p>}
            {contact.address && <p className="text-sm text-gray-600">{contact.address}</p>}
          </div>
          {/* Invoice Details */}
          <div className="text-right">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Detalles</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Fecha:</span>
                <span className="text-sm font-medium text-gray-900">{formatDate(invoice.date)}</span>
              </div>
              {invoice.dueDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Vencimiento:</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
                </div>
              )}
              {invoice.number && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Número:</span>
                  <span className="text-sm font-medium text-gray-900">#{invoice.number}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="min-w-full">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-3 text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                <th className="text-center py-3 text-xs font-semibold text-gray-500 uppercase w-20">Cant.</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase w-28">Precio Unit.</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase w-20">Desc.%</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase w-20">IVA%</th>
                <th className="text-right py-3 text-xs font-semibold text-gray-500 uppercase w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => {
                const qty = parseFloat(item.quantity || 0)
                const price = parseFloat(item.price || 0)
                const discount = parseFloat(item.discount || 0)
                const tax = parseFloat(item.tax || 0)
                const lineBase = qty * price * (1 - discount / 100)
                const lineTax = lineBase * (tax / 100)
                const lineTotal = lineBase + lineTax
                return (
                  <tr key={idx}>
                    <td className="py-3 text-sm text-gray-900">{item.description || item.name || '—'}</td>
                    <td className="py-3 text-sm text-gray-700 text-center">{item.quantity}</td>
                    <td className="py-3 text-sm text-gray-700 text-right">{formatCOP(price)}</td>
                    <td className="py-3 text-sm text-gray-700 text-right">{discount ? `${discount}%` : '—'}</td>
                    <td className="py-3 text-sm text-gray-700 text-right">{tax}%</td>
                    <td className="py-3 text-sm font-medium text-gray-900 text-right">{formatCOP(lineTotal)}</td>
                  </tr>
                )
              })}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-gray-400">Sin ítems</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCOP(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>IVA</span>
              <span>{formatCOP(totalIVA)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t-2 border-gray-200">
              <span>Total</span>
              <span className="text-indigo-700">{formatCOP(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="border-t border-gray-100 pt-6">
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notas</p>
            <p className="text-sm text-gray-700">{invoice.notes}</p>
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title="Confirmar Acción"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro que deseas{' '}
          <strong>{actionLabels[confirmAction]}</strong> esta factura?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
          <Button
            variant={confirmAction === 'delete' || confirmAction === 'cancel' ? 'danger' : 'primary'}
            isLoading={isActionLoading}
            onClick={handleConfirmAction}
          >
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

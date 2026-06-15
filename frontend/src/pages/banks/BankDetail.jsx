import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Check, Landmark } from 'lucide-react'
import { getAccount, getTransactions, createTransaction } from '../../api/banks'
import { useToast } from '../../contexts/ToastContext'
import { Card } from '../../components/UI/Card'
import { Button } from '../../components/UI/Button'
import { Modal } from '../../components/UI/Modal'
import { Input } from '../../components/UI/Input'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'
import { Table } from '../../components/UI/Table'
import { useForm } from 'react-hook-form'
import { formatCOP, formatDate } from '../../utils/format'

function TransactionForm({ onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: { type: 'credit', description: '', reference: '', amount: '', date: new Date().toISOString().split('T')[0] }
  })
  const txType = watch('type')
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Movimiento</label>
        <div className="flex gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="credit" {...register('type')} className="text-indigo-600" />
            <span className="text-sm font-medium text-green-700">Ingreso</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="debit" {...register('type')} className="text-indigo-600" />
            <span className="text-sm font-medium text-red-700">Egreso</span>
          </label>
        </div>
      </div>
      <Input
        label="Descripción *"
        error={errors.description?.message}
        {...register('description', { required: 'La descripción es requerida' })}
        placeholder="Ej: Pago cliente ABC"
      />
      <Input
        label="Referencia"
        {...register('reference')}
        placeholder="Ej: REF-001"
      />
      <Input
        label="Monto *"
        type="number"
        min="0"
        step="0.01"
        error={errors.amount?.message}
        {...register('amount', { required: 'El monto es requerido', min: { value: 0.01, message: 'Debe ser mayor a 0' } })}
        placeholder="0"
      />
      <Input
        label="Fecha *"
        type="date"
        error={errors.date?.message}
        {...register('date', { required: 'La fecha es requerida' })}
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" isLoading={isLoading}>Agregar Movimiento</Button>
      </div>
    </form>
  )
}

export default function BankDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: accountRaw, isLoading: accountLoading } = useQuery({
    queryKey: ['bank', id],
    queryFn: () => getAccount(id),
  })

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['bank-transactions', id, dateFrom, dateTo],
    queryFn: () => getTransactions(id, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }),
    enabled: !!id,
  })

  const account = accountRaw?.data || accountRaw
  const transactions = txData?.data || txData || []
  const txList = Array.isArray(transactions) ? transactions : []

  const createTxMutation = useMutation({
    mutationFn: (data) => createTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-transactions', id] })
      queryClient.invalidateQueries({ queryKey: ['bank', id] })
      queryClient.invalidateQueries({ queryKey: ['banks'] })
      showSuccess('Movimiento registrado exitosamente')
      setModalOpen(false)
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al registrar movimiento'),
  })

  const columns = [
    {
      key: 'date',
      header: 'Fecha',
      render: (val) => <span className="text-gray-600">{formatDate(val)}</span>,
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (val) => <span className="text-gray-900 font-medium">{val}</span>,
    },
    {
      key: 'reference',
      header: 'Referencia',
      render: (val) => <span className="text-gray-500 text-sm">{val || '—'}</span>,
    },
    {
      key: 'amount',
      header: 'Débito',
      render: (val, row) =>
        row.type === 'debit' ? (
          <span className="text-red-600 font-medium">{formatCOP(val)}</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: 'amount',
      header: 'Crédito',
      render: (val, row) =>
        row.type === 'credit' ? (
          <span className="text-green-600 font-medium">{formatCOP(val)}</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: 'balance',
      header: 'Saldo',
      render: (val) =>
        val !== undefined ? (
          <span className="font-semibold text-gray-900">{formatCOP(val)}</span>
        ) : (
          <span className="text-gray-300">—</span>
        ),
    },
    {
      key: 'reconciled',
      header: 'Conciliado',
      render: (val) =>
        val ? (
          <Check className="w-4 h-4 text-green-500" />
        ) : (
          <span className="text-gray-300 text-xs">No</span>
        ),
    },
  ]

  if (accountLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!account) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Cuenta no encontrada</p>
        <button onClick={() => navigate('/banks')} className="text-indigo-600 hover:underline mt-2 block mx-auto">
          Volver a cuentas
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{account.name}</h2>
            <p className="text-sm text-gray-500">
              {account.bank || 'Sin banco'}{account.accountNumber ? ` · ${account.accountNumber}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Agregar Movimiento
        </Button>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 text-white sm:col-span-1">
          <p className="text-indigo-200 text-sm mb-1">Saldo Actual</p>
          <p className="text-3xl font-bold">{formatCOP(account.balance ?? 0)}</p>
          <div className="flex items-center gap-1 mt-2">
            <Landmark className="w-4 h-4 text-indigo-300" />
            <span className="text-indigo-300 text-sm">{account.bank || 'Cuenta'}</span>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Total Ingresos</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCOP(txList.filter(t => t.type === 'credit').reduce((s, t) => s + (t.amount || 0), 0))}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <p className="text-sm text-gray-500 mb-1">Total Egresos</p>
          <p className="text-2xl font-bold text-red-600">
            {formatCOP(txList.filter(t => t.type === 'debit').reduce((s, t) => s + (t.amount || 0), 0))}
          </p>
        </div>
      </div>

      {/* Transactions */}
      <Card
        title="Movimientos"
        action={
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-gray-400 text-sm">—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {(dateFrom || dateTo) && (
              <button onClick={() => { setDateFrom(''); setDateTo('') }} className="text-xs text-gray-400 hover:text-gray-600">
                Limpiar
              </button>
            )}
          </div>
        }
      >
        <div className="-m-6">
          <Table
            columns={columns}
            data={txList}
            isLoading={txLoading}
            emptyMessage="No hay movimientos registrados"
          />
        </div>
      </Card>

      {/* Add Transaction Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Agregar Movimiento"
        size="md"
      >
        <TransactionForm
          onSubmit={(data) => createTxMutation.mutate(data)}
          isLoading={createTxMutation.isPending}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

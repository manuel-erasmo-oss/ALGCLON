import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Landmark, CreditCard } from 'lucide-react'
import { getAccounts, createAccount } from '../../api/banks'
import { useToast } from '../../contexts/ToastContext'
import { Button } from '../../components/UI/Button'
import { Modal } from '../../components/UI/Modal'
import { Input } from '../../components/UI/Input'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'
import { useForm } from 'react-hook-form'
import { formatCOP } from '../../utils/format'

const bankOptions = [
  'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Banco Popular',
  'Banco Caja Social', 'Nequi', 'Daviplata', 'Otro',
]

function BankAccountCard({ account, onClick }) {
  const isPositive = (account.balance ?? 0) >= 0
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md hover:border-indigo-200 transition-all text-left w-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Landmark className="w-6 h-6 text-indigo-600" />
        </div>
        <span className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{formatCOP(account.balance ?? 0)}
        </span>
      </div>
      <h3 className="font-semibold text-gray-900 text-lg mb-1">{account.name}</h3>
      <p className="text-sm text-gray-500">{account.bank || 'Sin banco'}</p>
      {account.accountNumber && (
        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
          <CreditCard className="w-3 h-3" />
          {account.accountNumber}
        </p>
      )}
    </button>
  )
}

function NewAccountForm({ onSubmit, isLoading, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { name: '', bank: '', accountNumber: '', initialBalance: 0 }
  })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nombre de la cuenta *"
        error={errors.name?.message}
        {...register('name', { required: 'El nombre es requerido' })}
        placeholder="Ej: Cuenta Corriente Principal"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
        <select
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          {...register('bank')}
        >
          <option value="">Seleccionar banco...</option>
          {bankOptions.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>
      <Input
        label="Número de cuenta"
        {...register('accountNumber')}
        placeholder="Ej: 123-456789-00"
      />
      <Input
        label="Saldo inicial"
        type="number"
        step="0.01"
        {...register('initialBalance', { valueAsNumber: true })}
        placeholder="0"
      />
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" isLoading={isLoading}>Crear Cuenta</Button>
      </div>
    </form>
  )
}

export default function BanksList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const [modalOpen, setModalOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['banks'],
    queryFn: getAccounts,
  })

  const accounts = data?.data || data || []
  const accountList = Array.isArray(accounts) ? accounts : []

  const totalBalance = accountList.reduce((sum, a) => sum + (a.balance ?? 0), 0)

  const createMutation = useMutation({
    mutationFn: createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] })
      showSuccess('Cuenta bancaria creada exitosamente')
      setModalOpen(false)
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al crear cuenta'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Cuentas Bancarias</h2>
          <p className="text-sm text-gray-500">{accountList.length} cuenta{accountList.length !== 1 ? 's' : ''} registrada{accountList.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          Nueva Cuenta
        </Button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-xl p-6 text-white">
        <p className="text-indigo-200 text-sm mb-1">Saldo Total</p>
        <p className="text-4xl font-bold">{formatCOP(totalBalance)}</p>
        <p className="text-indigo-300 text-sm mt-1">{accountList.length} cuenta{accountList.length !== 1 ? 's' : ''} activa{accountList.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Accounts Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : accountList.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium mb-1">Sin cuentas bancarias</p>
          <p className="text-gray-400 text-sm mb-4">Agrega tu primera cuenta para empezar a gestionar tus finanzas</p>
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Agregar Cuenta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountList.map((account) => (
            <BankAccountCard
              key={account.id}
              account={account}
              onClick={() => navigate(`/banks/${account.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nueva Cuenta Bancaria"
        size="md"
      >
        <NewAccountForm
          onSubmit={(data) => createMutation.mutate(data)}
          isLoading={createMutation.isPending}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  )
}

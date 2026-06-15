import React, { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Building2, FileText, Save } from 'lucide-react'
import { getSettings, updateSettings, updateInvoiceSettings } from '../../api/settings'
import { useToast } from '../../contexts/ToastContext'
import { Input } from '../../components/UI/Input'
import { Button } from '../../components/UI/Button'
import { LoadingSpinner } from '../../components/UI/LoadingSpinner'

const TABS = [
  { key: 'company', label: 'Empresa', icon: Building2 },
  { key: 'invoice', label: 'Facturación', icon: FileText },
]

function CompanySettingsForm({ defaultValues, onSubmit, isLoading }) {
  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm({
    defaultValues: defaultValues || {},
  })

  useEffect(() => {
    if (defaultValues) reset(defaultValues)
  }, [defaultValues, reset])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="sm:col-span-2">
          <Input
            label="Nombre de la empresa *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre de empresa es requerido' })}
            placeholder="Mi Empresa S.A.S"
          />
        </div>
        <Input
          label="NIT / Identificación tributaria"
          {...register('nit')}
          placeholder="900123456-1"
        />
        <Input
          label="Teléfono"
          type="tel"
          {...register('phone')}
          placeholder="Ej: 601 234 5678"
        />
        <div className="sm:col-span-2">
          <Input
            label="Dirección"
            {...register('address')}
            placeholder="Calle 123 # 45-67"
          />
        </div>
        <Input
          label="Ciudad"
          {...register('city')}
          placeholder="Bogotá"
        />
        <Input
          label="País"
          {...register('country')}
          placeholder="Colombia"
        />
        <div className="sm:col-span-2">
          <Input
            label="Correo electrónico de la empresa"
            type="email"
            {...register('email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido',
              },
            })}
            error={errors.email?.message}
            placeholder="empresa@ejemplo.com"
          />
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Sitio web"
            {...register('website')}
            placeholder="https://www.miempresa.com"
          />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          <Save className="w-4 h-4" />
          Guardar Cambios
        </Button>
      </div>
    </form>
  )
}

function InvoiceSettingsForm({ defaultValues, onSubmit, isLoading }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: defaultValues || {},
  })

  useEffect(() => {
    if (defaultValues) reset(defaultValues)
  }, [defaultValues, reset])

  const taxOptions = [0, 5, 8, 16, 19]
  const dueDayOptions = [0, 15, 30, 45, 60, 90]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Input
          label="Prefijo de factura"
          {...register('prefix')}
          placeholder="Ej: FAC"
          helperText="Prefijo para el número de factura"
        />
        <Input
          label="Próximo número"
          type="number"
          min="1"
          {...register('nextNumber', { valueAsNumber: true })}
          placeholder="1"
          helperText="El número que tendrá la próxima factura"
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Días de vencimiento por defecto</label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register('defaultDueDays', { valueAsNumber: true })}
          >
            {dueDayOptions.map((d) => (
              <option key={d} value={d}>{d === 0 ? 'Inmediato' : `${d} días`}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Al crear una factura, el vencimiento se calculará automáticamente</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tasa de IVA por defecto (%)</label>
          <select
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            {...register('defaultTaxRate', { valueAsNumber: true })}
          >
            {taxOptions.map((t) => (
              <option key={t} value={t}>{t}%</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas por defecto en facturas</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
            placeholder="Gracias por su compra. Condiciones de pago..."
            {...register('defaultNotes')}
          />
        </div>
        <div className="sm:col-span-2">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Enviar copia al correo de la empresa</p>
              <p className="text-xs text-gray-500 mt-0.5">Recibirás una copia cada vez que se envíe una factura</p>
            </div>
            <input
              type="checkbox"
              className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              {...register('sendCopyToCompany')}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" isLoading={isLoading}>
          <Save className="w-4 h-4" />
          Guardar Configuración
        </Button>
      </div>
    </form>
  )
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company')
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const { data: settingsRaw, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  })

  const settings = settingsRaw?.data || settingsRaw || {}
  const company = settings.company || settings || {}
  const invoiceSettings = settings.invoice || settings.invoiceSettings || {}

  const updateCompanyMutation = useMutation({
    mutationFn: (data) => updateSettings({ company: data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      showSuccess('Configuración de empresa guardada')
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al guardar configuración'),
  })

  const updateInvoiceMutation = useMutation({
    mutationFn: (data) => updateInvoiceSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      showSuccess('Configuración de facturación guardada')
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al guardar configuración'),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Configuración</h2>
        <p className="text-sm text-gray-500">Administra la configuración de tu empresa y facturación</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : activeTab === 'company' ? (
            <CompanySettingsForm
              defaultValues={company}
              onSubmit={(data) => updateCompanyMutation.mutate(data)}
              isLoading={updateCompanyMutation.isPending}
            />
          ) : (
            <InvoiceSettingsForm
              defaultValues={invoiceSettings}
              onSubmit={(data) => updateInvoiceMutation.mutate(data)}
              isLoading={updateInvoiceMutation.isPending}
            />
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building2 } from 'lucide-react'
import { getContact, updateContact } from '../../api/contacts'
import { getInvoices } from '../../api/invoices'
import { useToast } from '../../contexts/ToastContext'
import Card from '../../components/UI/Card'
import Badge from '../../components/UI/Badge'
import Table from '../../components/UI/Table'
import { Modal } from '../../components/UI/Modal'
import { Button } from '../../components/UI/Button'
import { Input } from '../../components/UI/Input'
import { Select } from '../../components/UI/Select'
import LoadingSpinner from '../../components/UI/LoadingSpinner'
import { formatCOP, formatDate } from '../../utils/format'

const TYPE_OPTIONS = [
  { value: 'customer', label: 'Cliente' },
  { value: 'supplier', label: 'Proveedor' },
]

const STATUS_VARIANTS = {
  DRAFT: 'default', SENT: 'info', PAID: 'success', OVERDUE: 'danger', CANCELLED: 'default',
}
const STATUS_LABELS = {
  DRAFT: 'Borrador', SENT: 'Enviada', PAID: 'Pagada', OVERDUE: 'Vencida', CANCELLED: 'Cancelada',
}

export default function ContactDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()
  const [editOpen, setEditOpen] = useState(false)

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id),
  })

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', { contactId: id }],
    queryFn: () => getInvoices({ contactId: id }),
  })

  const invoices = invoicesData?.data || invoicesData?.invoices || invoicesData || []

  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const updateMutation = useMutation({
    mutationFn: (data) => updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact', id] })
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      showSuccess('Contacto actualizado')
      setEditOpen(false)
    },
    onError: (e) => showError(e?.response?.data?.message || 'Error al actualizar'),
  })

  const openEdit = () => {
    if (contact) {
      reset({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        nit: contact.nit,
        type: contact.type,
        address: contact.address,
      })
    }
    setEditOpen(true)
  }

  const invoiceColumns = [
    { key: 'number', label: '# Factura', render: (v) => v || '-' },
    { key: 'issue_date', label: 'Fecha', render: (v) => formatDate(v) },
    { key: 'due_date', label: 'Vencimiento', render: (v) => formatDate(v) },
    { key: 'total', label: 'Total', render: (v) => formatCOP(v) },
    {
      key: 'status',
      label: 'Estado',
      render: (v) => <Badge variant={STATUS_VARIANTS[v] || 'default'}>{STATUS_LABELS[v] || v}</Badge>,
    },
  ]

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  if (!contact) {
    return <div className="text-center py-20 text-gray-500">Contacto no encontrado</div>
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <Button variant="outline" size="sm" onClick={openEdit}>
          <Edit className="h-4 w-4 mr-1" />
          Editar
        </Button>
      </div>

      <Card>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
            <Badge variant={contact.type === 'customer' ? 'info' : 'warning'} className="mt-1">
              {contact.type === 'customer' ? 'Cliente' : 'Proveedor'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contact.nit && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span><span className="font-medium">NIT:</span> {contact.nit}</span>
            </div>
          )}
          {contact.email && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{contact.email}</span>
            </div>
          )}
          {contact.phone && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{contact.phone}</span>
            </div>
          )}
          {contact.address && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{contact.address}</span>
            </div>
          )}
        </div>
      </Card>

      <Card title="Historial de facturas">
        <Table columns={invoiceColumns} data={Array.isArray(invoices) ? invoices : []} loading={invoicesLoading} />
      </Card>

      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Editar Contacto" size="md">
        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
          <Input label="Nombre *" error={errors.name?.message} {...register('name', { required: 'Requerido' })} />
          <Input label="NIT / CC" {...register('nit')} />
          <Input label="Email" type="email" {...register('email')} />
          <Input label="Teléfono" {...register('phone')} />
          <Select label="Tipo *" options={TYPE_OPTIONS} placeholder="Seleccionar tipo" error={errors.type?.message} {...register('type', { required: 'Requerido' })} />
          <Input label="Dirección" {...register('address')} />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={updateMutation.isPending}>Actualizar</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

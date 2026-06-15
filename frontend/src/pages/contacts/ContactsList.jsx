import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Plus, Search, Trash2, Edit, Eye } from 'lucide-react'
import { getContacts, createContact, updateContact, deleteContact } from '../../api/contacts'
import { useToast } from '../../contexts/ToastContext'
import Table from '../../components/UI/Table'
import Pagination from '../../components/UI/Pagination'
import Badge from '../../components/UI/Badge'
import Card from '../../components/UI/Card'
import { Modal } from '../../components/UI/Modal'
import { Button } from '../../components/UI/Button'
import { Input } from '../../components/UI/Input'
import { Select } from '../../components/UI/Select'

const TYPE_LABELS = { customer: 'Cliente', supplier: 'Proveedor' }
const TYPE_VARIANTS = { customer: 'info', supplier: 'warning' }

const TYPE_OPTIONS = [
  { value: 'customer', label: 'Cliente' },
  { value: 'supplier', label: 'Proveedor' },
]

const FILTER_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Clientes', value: 'customer' },
  { label: 'Proveedores', value: 'supplier' },
]

export default function ContactsList() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editContact, setEditContact] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const params = { page, search, type: typeFilter }

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', params],
    queryFn: () => getContacts(params),
  })

  const contacts = data?.data || data?.contacts || data || []
  const totalPages = data?.totalPages || data?.meta?.totalPages || 1

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm()

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      showSuccess('Contacto creado')
      setModalOpen(false)
      reset()
    },
    onError: (e) => showError(e?.response?.data?.message || 'Error al crear contacto'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      showSuccess('Contacto actualizado')
      setModalOpen(false)
      setEditContact(null)
      reset()
    },
    onError: (e) => showError(e?.response?.data?.message || 'Error al actualizar contacto'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      showSuccess('Contacto eliminado')
      setDeleteId(null)
    },
    onError: (e) => showError(e?.response?.data?.message || 'Error al eliminar contacto'),
  })

  const openCreate = () => {
    setEditContact(null)
    reset({})
    setModalOpen(true)
  }

  const openEdit = (contact) => {
    setEditContact(contact)
    reset({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      nit: contact.nit,
      type: contact.type,
      address: contact.address,
    })
    setModalOpen(true)
  }

  const onSubmit = (formData) => {
    if (editContact) {
      updateMutation.mutate({ id: editContact.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'nit', label: 'NIT/CC', render: (v) => v || '-' },
    { key: 'email', label: 'Email', render: (v) => v || '-' },
    { key: 'phone', label: 'Teléfono', render: (v) => v || '-' },
    {
      key: 'type',
      label: 'Tipo',
      render: (v) => <Badge variant={TYPE_VARIANTS[v] || 'default'}>{TYPE_LABELS[v] || v || '-'}</Badge>,
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/contacts/${row.id}`) }}
            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
            title="Ver"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(row) }}
            className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteId(row.id) }}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Contacto
        </Button>
      </div>

      <Card>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o NIT..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Buscar</Button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setTypeFilter(tab.value); setPage(1) }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                typeFilter === tab.value
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Table columns={columns} data={Array.isArray(contacts) ? contacts : []} loading={isLoading} />

        <div className="border-t border-gray-200 mt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditContact(null); reset() }}
        title={editContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nombre *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es requerido' })}
          />
          <Input
            label="NIT / CC"
            error={errors.nit?.message}
            {...register('nit')}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Teléfono"
            error={errors.phone?.message}
            {...register('phone')}
          />
          <Select
            label="Tipo *"
            options={TYPE_OPTIONS}
            placeholder="Seleccionar tipo"
            error={errors.type?.message}
            {...register('type', { required: 'El tipo es requerido' })}
          />
          <Input
            label="Dirección"
            error={errors.address?.message}
            {...register('address')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setModalOpen(false); setEditContact(null); reset() }}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isMutating}>
              {editContact ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Eliminar contacto"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de que deseas eliminar este contacto? Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteId)}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  )
}

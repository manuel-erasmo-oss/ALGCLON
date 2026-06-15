import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products'
import { useToast } from '../../contexts/ToastContext'
import Table from '../../components/UI/Table'
import Pagination from '../../components/UI/Pagination'
import Badge from '../../components/UI/Badge'
import Card from '../../components/UI/Card'
import { Modal } from '../../components/UI/Modal'
import { Button } from '../../components/UI/Button'
import { Input } from '../../components/UI/Input'
import { Select } from '../../components/UI/Select'
import { formatCOP } from '../../utils/format'

const TYPE_OPTIONS = [
  { value: 'product', label: 'Producto' },
  { value: 'service', label: 'Servicio' },
]

const TYPE_TABS = [
  { label: 'Todos', value: '' },
  { label: 'Productos', value: 'product' },
  { label: 'Servicios', value: 'service' },
]

export default function ProductsList() {
  const queryClient = useQueryClient()
  const { showSuccess, showError } = useToast()

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  const params = { page, search, type: typeFilter }

  const { data, isLoading } = useQuery({
    queryKey: ['products', params],
    queryFn: () => getProducts(params),
  })

  const products = data?.data || data?.products || data || []
  const totalPages = data?.totalPages || data?.meta?.totalPages || 1

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const watchedType = watch('type')

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showSuccess('Producto creado')
      setModalOpen(false)
      reset()
    },
    onError: (e) => showError(e?.response?.data?.message || 'Error al crear producto'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showSuccess('Producto actualizado')
      setModalOpen(false)
      setEditProduct(null)
      reset()
    },
    onError: (e) => showError(e?.response?.data?.message || 'Error al actualizar'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      showSuccess('Producto eliminado')
      setDeleteId(null)
    },
    onError: (e) => showError(e?.response?.data?.message || 'Error al eliminar'),
  })

  const openCreate = () => {
    setEditProduct(null)
    reset({ type: 'product' })
    setModalOpen(true)
  }

  const openEdit = (product) => {
    setEditProduct(product)
    reset({
      name: product.name,
      description: product.description,
      sku: product.sku,
      price: product.price,
      type: product.type,
      stock: product.stock,
      tax_rate: product.tax_rate,
    })
    setModalOpen(true)
  }

  const onSubmit = (formData) => {
    const payload = { ...formData, price: parseFloat(formData.price) || 0, tax_rate: parseFloat(formData.tax_rate) || 0, stock: formData.type === 'product' ? (parseInt(formData.stock) || 0) : undefined }
    if (editProduct) {
      updateMutation.mutate({ id: editProduct.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const columns = [
    { key: 'name', label: 'Nombre' },
    { key: 'sku', label: 'SKU', render: (v) => v || '-' },
    {
      key: 'type',
      label: 'Tipo',
      render: (v) => <Badge variant={v === 'product' ? 'info' : 'warning'}>{v === 'product' ? 'Producto' : 'Servicio'}</Badge>,
    },
    { key: 'price', label: 'Precio', render: (v) => formatCOP(v) },
    {
      key: 'stock',
      label: 'Stock',
      render: (v, row) => row.type === 'product' ? (v ?? 0) : '-',
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.stopPropagation(); openEdit(row) }} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded" title="Editar">
            <Edit className="h-4 w-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id) }} className="p-1.5 text-gray-400 hover:text-red-600 rounded" title="Eliminar">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const isMutating = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div />
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Producto
        </Button>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre o SKU..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm">Buscar</Button>
          </form>
        </div>

        <div className="flex gap-1 mb-4 border-b border-gray-200">
          {TYPE_TABS.map((tab) => (
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

        <Table columns={columns} data={Array.isArray(products) ? products : []} loading={isLoading} />
        <div className="border-t border-gray-200 mt-2">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditProduct(null); reset() }}
        title={editProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Nombre *" error={errors.name?.message} {...register('name', { required: 'Requerido' })} />
          <Input label="Descripción" {...register('description')} />
          <Input label="SKU" {...register('sku')} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Precio *" type="number" step="0.01" error={errors.price?.message} {...register('price', { required: 'Requerido', min: { value: 0, message: 'Debe ser positivo' } })} />
            <Input label="IVA (%)" type="number" step="0.01" {...register('tax_rate')} />
          </div>
          <Select label="Tipo *" options={TYPE_OPTIONS} placeholder="Seleccionar tipo" error={errors.type?.message} {...register('type', { required: 'Requerido' })} />
          {watchedType === 'product' && (
            <Input label="Stock" type="number" {...register('stock')} />
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditProduct(null); reset() }}>Cancelar</Button>
            <Button type="submit" variant="primary" isLoading={isMutating}>{editProduct ? 'Actualizar' : 'Crear'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Eliminar producto" size="sm">
        <p className="text-sm text-gray-600 mb-6">¿Estás seguro de que deseas eliminar este producto?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteId)}>Eliminar</Button>
        </div>
      </Modal>
    </div>
  )
}

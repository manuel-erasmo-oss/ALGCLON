import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../../api/products';
import { useToast } from '../../contexts/ToastContext';
import { Table } from '../../components/UI/Table';
import { Modal } from '../../components/UI/Modal';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Pagination } from '../../components/UI/Pagination';
import { ProductForm } from '../../components/forms/ProductForm';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const categoryLabels = {
  services: 'Servicios',
  goods: 'Bienes',
  software: 'Software',
  consulting: 'Consultoría',
  other: 'Otro',
};

export default function ProductsList() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = {
    search: search || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    page,
    limit,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['products', queryParams],
    queryFn: () => getProducts(queryParams),
  });

  const products = data?.data || data || [];
  const total = data?.total || (Array.isArray(products) ? products.length : 0);
  const totalPages = Math.ceil(total / limit);

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccess('Producto creado exitosamente');
      setModalOpen(false);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al crear producto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccess('Producto actualizado exitosamente');
      setModalOpen(false);
      setEditingProduct(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al actualizar producto'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      showSuccess('Producto eliminado');
      setDeleteConfirm(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al eliminar producto'),
  });

  const handleSubmit = (formData) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const categories = ['all', 'services', 'goods', 'software', 'consulting', 'other'];

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (val, row) => (
        <div>
          <p className="font-medium text-gray-900">{val}</p>
          {row.code && <p className="text-xs text-gray-400">{row.code}</p>}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (val) => <Badge variant="gray">{categoryLabels[val] || val || '—'}</Badge>,
    },
    {
      key: 'price',
      header: 'Precio',
      render: (val) => <span className="font-medium">{formatCurrency(val)}</span>,
    },
    {
      key: 'cost',
      header: 'Costo',
      render: (val) => formatCurrency(val),
    },
    {
      key: 'tax',
      header: 'IVA',
      render: (val) => (val ? `${val}%` : '0%'),
    },
    {
      key: 'unit',
      header: 'Unidad',
      render: (val) => val || '—',
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      render: (val, row) =>
        row.trackInventory ? (
          <span className={val <= 0 ? 'text-red-600 font-medium' : 'text-gray-700'}>{val ?? 0}</span>
        ) : (
          <span className="text-gray-400 text-xs">N/A</span>
        ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '90px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditingProduct(row); setModalOpen(true); }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeleteConfirm(row)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Productos y Servicios</h2>
          <p className="text-sm text-gray-500">{total} producto{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setModalOpen(true); }}>
          <Plus className="w-4 h-4" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-1 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategoryFilter(cat); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat === 'all' ? 'Todos' : categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>

        <Table columns={columns} data={products} isLoading={isLoading} emptyMessage="No se encontraron productos" />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={total}
        />
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingProduct(null); }}
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        size="lg"
      >
        <ProductForm
          defaultValues={editingProduct}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro que deseas eliminar{' '}
          <strong className="text-gray-900">{deleteConfirm?.name}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
          >
            Eliminar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

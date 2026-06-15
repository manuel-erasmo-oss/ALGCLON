import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Eye, Users } from 'lucide-react';
import { getContacts, createContact, updateContact, deleteContact } from '../../api/contacts';
import { useToast } from '../../contexts/ToastContext';
import { Table } from '../../components/UI/Table';
import { Modal } from '../../components/UI/Modal';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Pagination } from '../../components/UI/Pagination';
import { ContactForm } from '../../components/forms/ContactForm';

const typeLabels = {
  client: 'Cliente',
  supplier: 'Proveedor',
  both: 'Ambos',
};

const typeBadgeVariant = {
  client: 'blue',
  supplier: 'green',
  both: 'indigo',
};

export default function ContactsList() {
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const queryParams = {
    search: search || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page,
    limit,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['contacts', queryParams],
    queryFn: () => getContacts(queryParams),
  });

  const contacts = data?.data || data || [];
  const total = data?.total || (Array.isArray(contacts) ? contacts.length : 0);
  const totalPages = Math.ceil(total / limit);

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      showSuccess('Contacto creado exitosamente');
      setModalOpen(false);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al crear contacto'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateContact(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      showSuccess('Contacto actualizado exitosamente');
      setModalOpen(false);
      setEditingContact(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al actualizar contacto'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      showSuccess('Contacto eliminado');
      setDeleteConfirm(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al eliminar contacto'),
  });

  const handleSubmit = (formData) => {
    if (editingContact) {
      updateMutation.mutate({ id: editingContact.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreate = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const openEdit = (contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const tabs = [
    { key: 'all', label: 'Todos' },
    { key: 'client', label: 'Clientes' },
    { key: 'supplier', label: 'Proveedores' },
  ];

  const columns = [
    {
      key: 'name',
      header: 'Nombre',
      render: (val, row) => (
        <Link to={`/contacts/${row.id}`} className="font-medium text-indigo-600 hover:text-indigo-700">
          {val}
        </Link>
      ),
    },
    {
      key: 'identificationNumber',
      header: 'Identificación',
      render: (val, row) => (
        <span className="text-gray-500">
          {row.identificationType && `${row.identificationType}: `}{val || '—'}
        </span>
      ),
    },
    { key: 'email', header: 'Email', render: (val) => val || '—' },
    { key: 'phone', header: 'Teléfono', render: (val) => val || '—' },
    {
      key: 'type',
      header: 'Tipo',
      render: (val) => (
        <Badge variant={typeBadgeVariant[val] || 'gray'}>
          {typeLabels[val] || val || '—'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '120px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/contacts/${row.id}`}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Ver detalle"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => openEdit(row)}
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
          <h2 className="text-lg font-semibold text-gray-900">Contactos</h2>
          <p className="text-sm text-gray-500">{total} contacto{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nuevo Contacto
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border-b border-gray-100">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar contactos..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Type Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setTypeFilter(tab.key); setPage(1); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                  typeFilter === tab.key
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <Table columns={columns} data={contacts} isLoading={isLoading} emptyMessage="No se encontraron contactos" />

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
        onClose={() => { setModalOpen(false); setEditingContact(null); }}
        title={editingContact ? 'Editar Contacto' : 'Nuevo Contacto'}
        size="lg"
      >
        <ContactForm
          defaultValues={editingContact}
          onSubmit={handleSubmit}
          isLoading={createMutation.isPending || updateMutation.isPending}
        />
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Eliminación"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro que deseas eliminar a{' '}
          <strong className="text-gray-900">{deleteConfirm?.name}</strong>? Esta acción no se puede deshacer.
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

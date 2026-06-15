import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Eye, Pencil, Trash2, Send, CheckCircle, XCircle, FileText } from 'lucide-react';
import {
  getInvoices,
  deleteInvoice,
  sendInvoice,
  markAsPaid,
  cancelInvoice,
} from '../../api/invoices';
import { useToast } from '../../contexts/ToastContext';
import { Table } from '../../components/UI/Table';
import { Modal } from '../../components/UI/Modal';
import { Button } from '../../components/UI/Button';
import { Badge } from '../../components/UI/Badge';
import { Pagination } from '../../components/UI/Pagination';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const statusTabs = [
  { key: 'all', label: 'Todas' },
  { key: 'draft', label: 'Borradores' },
  { key: 'sent', label: 'Enviadas' },
  { key: 'paid', label: 'Pagadas' },
  { key: 'overdue', label: 'Vencidas' },
  { key: 'cancelled', label: 'Canceladas' },
];

export default function InvoicesList() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [actionConfirm, setActionConfirm] = useState(null);

  const queryParams = {
    status: statusFilter !== 'all' ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    limit,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', queryParams],
    queryFn: () => getInvoices(queryParams),
  });

  const invoices = data?.data || data || [];
  const total = data?.total || (Array.isArray(invoices) ? invoices.length : 0);
  const totalPages = Math.ceil(total / limit);

  const deleteMutation = useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess('Factura eliminada');
      setDeleteConfirm(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al eliminar'),
  });

  const sendMutation = useMutation({
    mutationFn: sendInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess('Factura enviada exitosamente');
      setActionConfirm(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al enviar'),
  });

  const paidMutation = useMutation({
    mutationFn: markAsPaid,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess('Factura marcada como pagada');
      setActionConfirm(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al marcar como pagada'),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess('Factura cancelada');
      setActionConfirm(null);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al cancelar'),
  });

  const columns = [
    {
      key: 'number',
      header: '#',
      render: (val, row) => (
        <Link to={`/invoices/${row.id}`} className="font-medium text-indigo-600 hover:text-indigo-700">
          #{val || row.id}
        </Link>
      ),
    },
    {
      key: 'date',
      header: 'Fecha',
      render: (val) => formatDate(val),
    },
    {
      key: 'contact',
      header: 'Cliente',
      render: (val, row) => (
        <span className="text-gray-900">{val?.name || row.contactName || '—'}</span>
      ),
    },
    {
      key: 'dueDate',
      header: 'Vencimiento',
      render: (val) => formatDate(val),
    },
    {
      key: 'total',
      header: 'Total',
      render: (val) => <span className="font-semibold text-gray-900">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (val) => <Badge variant={val}>{val}</Badge>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      width: '160px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Link
            to={`/invoices/${row.id}`}
            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Ver"
          >
            <Eye className="w-4 h-4" />
          </Link>
          {row.status === 'draft' && (
            <Link
              to={`/invoices/${row.id}/edit`}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Editar"
            >
              <Pencil className="w-4 h-4" />
            </Link>
          )}
          {(row.status === 'draft' || row.status === 'sent') && (
            <button
              onClick={() => setActionConfirm({ type: 'send', invoice: row })}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Enviar"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
          {row.status === 'sent' && (
            <button
              onClick={() => setActionConfirm({ type: 'paid', invoice: row })}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Marcar como pagada"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {row.status !== 'cancelled' && row.status !== 'paid' && (
            <button
              onClick={() => setActionConfirm({ type: 'cancel', invoice: row })}
              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Cancelar"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {row.status === 'draft' && (
            <button
              onClick={() => setDeleteConfirm(row)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const actionMessages = {
    send: 'enviar',
    paid: 'marcar como pagada',
    cancel: 'cancelar',
  };

  const handleConfirmAction = () => {
    if (!actionConfirm) return;
    const { type, invoice } = actionConfirm;
    if (type === 'send') sendMutation.mutate(invoice.id);
    else if (type === 'paid') paidMutation.mutate(invoice.id);
    else if (type === 'cancel') cancelMutation.mutate(invoice.id);
  };

  const isActionLoading =
    sendMutation.isPending || paidMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Facturas</h2>
          <p className="text-sm text-gray-500">{total} factura{total !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/invoices/new">
          <Button>
            <Plus className="w-4 h-4" />
            Nueva Factura
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Status Tabs + Date Filters */}
        <div className="flex flex-col gap-3 p-4 border-b border-gray-100">
          <div className="flex gap-1 flex-wrap">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setPage(1); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  statusFilter === tab.key
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Desde:</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 whitespace-nowrap">Hasta:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {(dateFrom || dateTo) && (
              <button
                onClick={() => { setDateFrom(''); setDateTo(''); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>

        <Table
          columns={columns}
          data={invoices}
          isLoading={isLoading}
          emptyMessage="No se encontraron facturas"
        />

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={total}
        />
      </div>

      {/* Delete Confirmation */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Eliminar Factura"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Estás seguro que deseas eliminar la factura{' '}
          <strong>#{deleteConfirm?.number || deleteConfirm?.id}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button
            variant="danger"
            isLoading={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate(deleteConfirm.id)}
          >
            Eliminar
          </Button>
        </div>
      </Modal>

      {/* Action Confirmation */}
      <Modal
        isOpen={!!actionConfirm}
        onClose={() => setActionConfirm(null)}
        title="Confirmar Acción"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          ¿Deseas {actionMessages[actionConfirm?.type]} la factura{' '}
          <strong>#{actionConfirm?.invoice?.number || actionConfirm?.invoice?.id}</strong>?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setActionConfirm(null)}>Cancelar</Button>
          <Button isLoading={isActionLoading} onClick={handleConfirmAction}>
            Confirmar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

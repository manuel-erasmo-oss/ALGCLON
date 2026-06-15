import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Phone, MapPin, User, FileText } from 'lucide-react';
import { getContact } from '../../api/contacts';
import { getInvoices } from '../../api/invoices';
import { Badge } from '../../components/UI/Badge';
import { Card } from '../../components/UI/Card';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { Table } from '../../components/UI/Table';

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

export default function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contacts', id],
    queryFn: () => getContact(id),
  });

  const { data: invoicesData } = useQuery({
    queryKey: ['invoices', { contactId: id }],
    queryFn: () => getInvoices({ contactId: id }),
    enabled: !!id,
  });

  const invoices = invoicesData?.data || invoicesData || [];

  if (isLoading) return <LoadingSpinner overlay />;

  if (!contact) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Contacto no encontrado</p>
        <Link to="/contacts" className="text-indigo-600 hover:underline mt-2 block">
          Volver a contactos
        </Link>
      </div>
    );
  }

  const invoiceColumns = [
    {
      key: 'number',
      header: '#',
      render: (val, row) => (
        <Link to={`/invoices/${row.id}`} className="text-indigo-600 font-medium hover:underline">
          #{val || row.id}
        </Link>
      ),
    },
    { key: 'date', header: 'Fecha', render: (val) => formatDate(val) },
    { key: 'dueDate', header: 'Vencimiento', render: (val) => formatDate(val) },
    {
      key: 'total',
      header: 'Total',
      render: (val) => <span className="font-medium">{formatCurrency(val)}</span>,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (val) => <Badge variant={val}>{val}</Badge>,
    },
  ];

  const typeLabels = { client: 'Cliente', supplier: 'Proveedor', both: 'Cliente y Proveedor' };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Contactos
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600">
            {contact.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{contact.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {contact.identificationType && (
                <span className="text-sm text-gray-500">
                  {contact.identificationType}: {contact.identificationNumber || '—'}
                </span>
              )}
              {contact.type && (
                <Badge variant={contact.type === 'client' ? 'blue' : 'green'}>
                  {typeLabels[contact.type] || contact.type}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Link to={`/invoices/new?contactId=${contact.id}`}>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
            <FileText className="w-4 h-4" />
            Nueva Factura
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card title="Información de Contacto" className="lg:col-span-1">
          <dl className="space-y-4">
            {contact.email && (
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">Email</dt>
                  <dd className="text-sm text-gray-900">{contact.email}</dd>
                </div>
              </div>
            )}
            {contact.phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">Teléfono</dt>
                  <dd className="text-sm text-gray-900">{contact.phone}</dd>
                </div>
              </div>
            )}
            {contact.address && (
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                <div>
                  <dt className="text-xs text-gray-400">Dirección</dt>
                  <dd className="text-sm text-gray-900">{contact.address}</dd>
                  {contact.city && <dd className="text-sm text-gray-500">{contact.city}</dd>}
                </div>
              </div>
            )}
            {contact.notes && (
              <div className="pt-3 border-t border-gray-100">
                <dt className="text-xs text-gray-400 mb-1">Notas</dt>
                <dd className="text-sm text-gray-700">{contact.notes}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Invoice History */}
        <Card title="Historial de Facturas" className="lg:col-span-2">
          <Table
            columns={invoiceColumns}
            data={Array.isArray(invoices) ? invoices : []}
            emptyMessage="Sin facturas registradas"
          />
        </Card>
      </div>
    </div>
  );
}

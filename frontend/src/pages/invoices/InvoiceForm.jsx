import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { getInvoice, createInvoice, updateInvoice } from '../../api/invoices';
import { getContacts } from '../../api/contacts';
import { useToast } from '../../contexts/ToastContext';
import { InvoiceForm as InvoiceFormComponent } from '../../components/forms/InvoiceForm';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';

export default function InvoiceFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const isEditing = !!id;

  const { data: invoice, isLoading: invoiceLoading } = useQuery({
    queryKey: ['invoices', id],
    queryFn: () => getInvoice(id),
    enabled: isEditing,
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts', { limit: 100 }],
    queryFn: () => getContacts({ limit: 100 }),
  });

  const contacts = contactsData?.data || contactsData || [];

  const createMutation = useMutation({
    mutationFn: createInvoice,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess('Factura creada exitosamente');
      navigate(`/invoices/${data.id || data.data?.id}`);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al crear factura'),
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      showSuccess('Factura actualizada exitosamente');
      navigate(`/invoices/${id}`);
    },
    onError: (err) => showError(err?.response?.data?.message || 'Error al actualizar factura'),
  });

  const handleSubmit = (data) => {
    const payload = { ...data, status: 'sent' };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleSaveDraft = (data) => {
    const payload = { ...data, status: 'draft' };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (isEditing && invoiceLoading) return <LoadingSpinner overlay />;

  const defaultValues = invoice
    ? {
        type: invoice.type || 'invoice',
        contactId: invoice.contactId || invoice.contact?.id || '',
        number: invoice.number || '',
        date: invoice.date ? invoice.date.split('T')[0] : '',
        dueDate: invoice.dueDate ? invoice.dueDate.split('T')[0] : '',
        items: invoice.items || [],
        notes: invoice.notes || '',
      }
    : undefined;

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Facturas
      </button>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Editar Factura' : 'Nueva Factura'}
        </h2>

        <InvoiceFormComponent
          defaultValues={defaultValues}
          contacts={Array.isArray(contacts) ? contacts : []}
          onSubmit={handleSubmit}
          onSaveDraft={handleSaveDraft}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

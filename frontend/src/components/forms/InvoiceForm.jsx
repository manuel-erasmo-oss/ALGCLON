import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, Search } from 'lucide-react';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const invoiceTypes = [
  { value: 'invoice', label: 'Factura' },
  { value: 'quote', label: 'Cotización' },
  { value: 'credit_note', label: 'Nota Crédito' },
];

const defaultItem = { productId: '', description: '', quantity: 1, price: 0, discount: 0, tax: 19 };

function LineItem({ index, item, onRemove, onProductSearch, contacts, register, errors, watch, setValue }) {
  const qty = parseFloat(watch(`items.${index}.quantity`) || 0);
  const price = parseFloat(watch(`items.${index}.price`) || 0);
  const discount = parseFloat(watch(`items.${index}.discount`) || 0);
  const tax = parseFloat(watch(`items.${index}.tax`) || 0);

  const lineTotal = qty * price * (1 - discount / 100);
  const lineTax = lineTotal * (tax / 100);
  const lineGross = lineTotal + lineTax;

  return (
    <tr className="border-b border-gray-100">
      <td className="px-2 py-2">
        <input
          className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder="Descripción del producto/servicio"
          {...register(`items.${index}.description`, { required: true })}
        />
        {errors?.items?.[index]?.description && (
          <p className="text-xs text-red-500 mt-0.5">Requerido</p>
        )}
      </td>
      <td className="px-2 py-2 w-20">
        <input
          type="number"
          min="1"
          step="0.01"
          className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register(`items.${index}.quantity`, { required: true, min: 0.01 })}
        />
      </td>
      <td className="px-2 py-2 w-28">
        <input
          type="number"
          min="0"
          step="0.01"
          className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register(`items.${index}.price`, { required: true, min: 0 })}
        />
      </td>
      <td className="px-2 py-2 w-20">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register(`items.${index}.discount`)}
        />
      </td>
      <td className="px-2 py-2 w-20">
        <input
          type="number"
          min="0"
          max="100"
          step="0.01"
          className="block w-full rounded border border-gray-200 px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-500"
          {...register(`items.${index}.tax`)}
        />
      </td>
      <td className="px-2 py-2 w-32 text-right text-sm font-medium text-gray-900">
        {formatCurrency(lineGross)}
      </td>
      <td className="px-2 py-2 w-10">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors rounded"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

export function InvoiceForm({ defaultValues, contacts = [], onSubmit, onSaveDraft, isLoading }) {
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      type: 'invoice',
      date: today,
      dueDate: thirtyDaysLater,
      items: [{ ...defaultItem }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items') || [];

  const subtotal = watchedItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    const discount = parseFloat(item.discount || 0);
    return sum + qty * price * (1 - discount / 100);
  }, 0);

  const totalIVA = watchedItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity || 0);
    const price = parseFloat(item.price || 0);
    const discount = parseFloat(item.discount || 0);
    const tax = parseFloat(item.tax || 0);
    const lineTotal = qty * price * (1 - discount / 100);
    return sum + lineTotal * (tax / 100);
  }, 0);

  const total = subtotal + totalIVA;

  const clientOptions = contacts.map((c) => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Header Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Select
            label="Tipo de documento"
            options={invoiceTypes}
            error={errors.type?.message}
            {...register('type', { required: 'Requerido' })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cliente *
          </label>
          <select
            className={`block w-full rounded-lg border px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors ${
              errors.contactId ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
            {...register('contactId', { required: 'El cliente es requerido' })}
          >
            <option value="">Seleccionar cliente...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.contactId && (
            <p className="mt-1 text-xs text-red-600">{errors.contactId.message}</p>
          )}
        </div>

        <div>
          <Input
            label="Número de factura"
            error={errors.number?.message}
            {...register('number')}
            placeholder="Auto-generado"
          />
        </div>

        <div>
          <Input
            label="Fecha *"
            type="date"
            error={errors.date?.message}
            {...register('date', { required: 'La fecha es requerida' })}
          />
        </div>

        <div>
          <Input
            label="Fecha de vencimiento"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
        </div>
      </div>

      {/* Items Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Productos / Servicios</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ ...defaultItem })}
          >
            <Plus className="w-4 h-4" />
            Agregar ítem
          </Button>
        </div>

        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-2 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Descripción</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 uppercase w-20">Cant.</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 uppercase w-28">Precio</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 uppercase w-20">Desc.%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 uppercase w-20">IVA%</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold text-gray-500 uppercase w-32">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <LineItem
                    key={field.id}
                    index={index}
                    item={field}
                    onRemove={remove}
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                  />
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-sm text-gray-400">
                      Agrega al menos un ítem
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>IVA</span>
            <span>{formatCurrency(totalIVA)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Total</span>
            <span className="text-indigo-700">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
        <textarea
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[80px]"
          placeholder="Términos de pago, instrucciones especiales..."
          {...register('notes')}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            isLoading={isLoading}
            onClick={handleSubmit((data) => onSaveDraft({ ...data, status: 'draft' }))}
          >
            Guardar Borrador
          </Button>
        )}
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Actualizar' : 'Crear y Enviar'}
        </Button>
      </div>
    </form>
  );
}

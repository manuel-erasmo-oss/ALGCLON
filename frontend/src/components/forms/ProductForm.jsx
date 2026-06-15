import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

const categoryOptions = [
  { value: 'services', label: 'Servicios' },
  { value: 'goods', label: 'Bienes' },
  { value: 'software', label: 'Software' },
  { value: 'consulting', label: 'Consultoría' },
  { value: 'other', label: 'Otro' },
];

const unitOptions = [
  { value: 'unit', label: 'Unidad' },
  { value: 'hour', label: 'Hora' },
  { value: 'kg', label: 'Kilogramo' },
  { value: 'liter', label: 'Litro' },
  { value: 'month', label: 'Mes' },
  { value: 'pack', label: 'Paquete' },
];

export function ProductForm({ defaultValues, onSubmit, isLoading }) {
  const [trackInventory, setTrackInventory] = useState(
    defaultValues?.trackInventory || false
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      category: 'services',
      unit: 'unit',
      tax: 19,
      trackInventory: false,
    },
  });

  const handleFormSubmit = (data) => {
    onSubmit({ ...data, trackInventory });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nombre del producto/servicio *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es requerido' })}
            placeholder="Ej: Consultoría web"
          />
        </div>

        <div>
          <Input
            label="Código / SKU"
            error={errors.code?.message}
            {...register('code')}
            placeholder="Ej: PRD-001"
          />
        </div>

        <div>
          <Select
            label="Categoría"
            options={categoryOptions}
            error={errors.category?.message}
            {...register('category')}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[70px]"
            placeholder="Descripción del producto o servicio..."
            {...register('description')}
          />
        </div>

        <div>
          <Input
            label="Precio de venta *"
            type="number"
            min="0"
            step="0.01"
            error={errors.price?.message}
            {...register('price', {
              required: 'El precio es requerido',
              min: { value: 0, message: 'El precio debe ser positivo' },
            })}
            placeholder="0"
          />
        </div>

        <div>
          <Input
            label="Costo"
            type="number"
            min="0"
            step="0.01"
            error={errors.cost?.message}
            {...register('cost')}
            placeholder="0"
          />
        </div>

        <div>
          <Input
            label="IVA (%)"
            type="number"
            min="0"
            max="100"
            step="0.01"
            error={errors.tax?.message}
            {...register('tax', {
              min: { value: 0, message: 'Debe ser 0 o más' },
              max: { value: 100, message: 'No puede superar 100%' },
            })}
            placeholder="19"
          />
        </div>

        <div>
          <Select
            label="Unidad"
            options={unitOptions}
            error={errors.unit?.message}
            {...register('unit')}
          />
        </div>

        {/* Track Inventory Toggle */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-700">Controlar inventario</p>
              <p className="text-xs text-gray-500">Llevar control de stock de este producto</p>
            </div>
            <button
              type="button"
              onClick={() => setTrackInventory(!trackInventory)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                trackInventory ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  trackInventory ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {trackInventory && (
          <div className="sm:col-span-2">
            <Input
              label="Stock actual"
              type="number"
              min="0"
              step="1"
              error={errors.stockQuantity?.message}
              {...register('stockQuantity', {
                min: { value: 0, message: 'El stock debe ser positivo' },
              })}
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  );
}

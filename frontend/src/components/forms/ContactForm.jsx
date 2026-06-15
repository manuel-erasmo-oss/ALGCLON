import React from 'react';
import { useForm } from 'react-hook-form';
import { Input } from '../UI/Input';
import { Select } from '../UI/Select';
import { Button } from '../UI/Button';

const identificationTypes = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'NIT', label: 'NIT' },
  { value: 'CE', label: 'Cédula de Extranjería' },
  { value: 'PASSPORT', label: 'Pasaporte' },
  { value: 'OTHER', label: 'Otro' },
];

const contactTypes = [
  { value: 'client', label: 'Cliente' },
  { value: 'supplier', label: 'Proveedor' },
  { value: 'both', label: 'Cliente y Proveedor' },
];

export function ContactForm({ defaultValues, onSubmit, isLoading }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: defaultValues || { type: 'client', identificationType: 'CC' } });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Input
            label="Nombre completo / Razón social *"
            error={errors.name?.message}
            {...register('name', { required: 'El nombre es requerido' })}
            placeholder="Ej: Juan García o Empresa S.A.S"
          />
        </div>

        <div>
          <Select
            label="Tipo de identificación"
            options={identificationTypes}
            error={errors.identificationType?.message}
            {...register('identificationType')}
          />
        </div>

        <div>
          <Input
            label="Número de identificación"
            error={errors.identificationNumber?.message}
            {...register('identificationNumber')}
            placeholder="Ej: 900123456-1"
          />
        </div>

        <div>
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', {
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Email inválido',
              },
            })}
            placeholder="correo@ejemplo.com"
          />
        </div>

        <div>
          <Input
            label="Teléfono"
            type="tel"
            error={errors.phone?.message}
            {...register('phone')}
            placeholder="Ej: 300 123 4567"
          />
        </div>

        <div className="sm:col-span-2">
          <Input
            label="Dirección"
            error={errors.address?.message}
            {...register('address')}
            placeholder="Calle 123 # 45-67, Ciudad"
          />
        </div>

        <div>
          <Input
            label="Ciudad"
            error={errors.city?.message}
            {...register('city')}
            placeholder="Bogotá"
          />
        </div>

        <div>
          <Select
            label="Tipo de contacto"
            options={contactTypes}
            error={errors.type?.message}
            {...register('type')}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
          <textarea
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors min-h-[80px]"
            placeholder="Información adicional..."
            {...register('notes')}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="submit" isLoading={isLoading}>
          {defaultValues ? 'Actualizar Contacto' : 'Crear Contacto'}
        </Button>
      </div>
    </form>
  );
}

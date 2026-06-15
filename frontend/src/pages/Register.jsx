import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';

export default function Register() {
  const { register: authRegister } = useAuth();
  const { showError, showSuccess } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const { confirmPassword, ...rest } = data;
      await authRegister(rest);
      showSuccess('Cuenta creada exitosamente');
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Error al registrar. Intenta de nuevo.';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Alegra</h1>
          <p className="text-indigo-200 text-sm mt-1">Gestión contable simplificada</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Crear Cuenta</h2>
          <p className="text-sm text-gray-500 mb-6">Completa tus datos para comenzar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Nombre de la empresa *"
              error={errors.companyName?.message}
              {...register('companyName', { required: 'El nombre de empresa es requerido' })}
              placeholder="Mi Empresa S.A.S"
            />

            <Input
              label="NIT / Identificación *"
              error={errors.nit?.message}
              {...register('nit', { required: 'El NIT es requerido' })}
              placeholder="900123456-1"
            />

            <Input
              label="Nombre completo *"
              error={errors.name?.message}
              {...register('name', { required: 'El nombre es requerido' })}
              placeholder="Juan García"
            />

            <Input
              label="Correo electrónico *"
              type="email"
              error={errors.email?.message}
              {...register('email', {
                required: 'El correo es requerido',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Correo electrónico inválido',
                },
              })}
              placeholder="tu@empresa.com"
            />

            <div className="relative">
              <Input
                label="Contraseña *"
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirmar contraseña *"
                type={showConfirm ? 'text' : 'password'}
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Confirma tu contraseña',
                  validate: (value) => value === password || 'Las contraseñas no coinciden',
                })}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Crear Cuenta
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

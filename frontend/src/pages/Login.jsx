import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../contexts/ToastContext';
import { Input } from '../components/UI/Input';
import { Button } from '../components/UI/Button';

export default function Login() {
  const { login } = useAuth();
  const { showError } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ defaultValues: { email: '', password: '', rememberMe: false } });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      navigate('/', { replace: true });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Credenciales incorrectas. Intenta de nuevo.';
      showError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 to-primary-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Alegra</h1>
          <p className="text-indigo-200 text-sm mt-1">Gestión contable simplificada</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500 mb-6">Ingresa tus credenciales para continuar</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Correo electrónico"
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
              autoComplete="email"
            />

            <div className="relative">
              <Input
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                error={errors.password?.message}
                {...register('password', {
                  required: 'La contraseña es requerida',
                  minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                })}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  {...register('rememberMe')}
                />
                <span className="text-sm text-gray-600">Recordarme</span>
              </label>
              <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
              Iniciar Sesión
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

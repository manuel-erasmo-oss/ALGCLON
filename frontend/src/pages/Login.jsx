import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../contexts/ToastContext'
import { Button } from '../components/UI/Button'
import { Input } from '../components/UI/Input'

export default function Login() {
  const { login } = useAuth()
  const { showError } = useToast()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError('')
    try {
      await login(data)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al iniciar sesión'
      setError(msg)
      showError(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-900 flex-col items-center justify-center p-12">
        <div className="max-w-sm text-center">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-bold text-3xl">A</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">Alegra</h2>
          <p className="text-indigo-300 text-lg leading-relaxed">
            Administra tu negocio de forma simple, rápida y eficiente.
          </p>
          <div className="mt-10 space-y-3">
            {['Facturación electrónica', 'Control de inventario', 'Reportes financieros'].map((f) => (
              <div key={f} className="flex items-center gap-3 text-indigo-200">
                <div className="h-2 w-2 rounded-full bg-indigo-400" />
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Iniciar sesión</h1>
            <p className="mt-2 text-gray-500">Bienvenido de vuelta</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@empresa.com"
              error={errors.email?.message}
              {...register('email', {
                required: 'El correo es requerido',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Correo inválido' },
              })}
            />

            <Input
              label="Contraseña"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password', { required: 'La contraseña es requerida' })}
            />

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
              Iniciar sesión
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

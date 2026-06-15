import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { ChevronDown, LogOut, User } from 'lucide-react'

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/contacts': 'Contactos',
  '/products': 'Productos',
  '/invoices': 'Facturas',
  '/banks': 'Bancos',
  '/reports': 'Reportes',
  '/settings': 'Configuración',
}

function getPageTitle(pathname) {
  if (routeTitles[pathname]) return routeTitles[pathname]
  for (const [key, title] of Object.entries(routeTitles)) {
    if (pathname.startsWith(key + '/')) return title
  }
  return 'Alegra'
}

function getInitials(user) {
  if (!user) return '?'
  const name = user.name || user.email || ''
  return name
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0].toUpperCase())
    .join('')
}

export default function Topbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)

  const title = getPageTitle(location.pathname)
  const initials = getInitials(user)

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-xl font-semibold text-gray-800">{title}</h1>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-sm font-medium">{initials}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500" />
        </button>

        {open && (
          <div className="absolute right-0 mt-1 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

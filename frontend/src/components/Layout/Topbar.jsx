import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Bell, ChevronDown, User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const breadcrumbMap = {
  '/': 'Dashboard',
  '/invoices': 'Facturas',
  '/contacts': 'Contactos',
  '/products': 'Productos',
  '/banks': 'Bancos',
  '/reports': 'Reportes',
  '/settings': 'Configuración',
  '/purchases': 'Compras',
  '/accounting': 'Contabilidad',
  '/invoices/new': 'Nueva Factura',
};

export function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const pageTitle = breadcrumbMap[location.pathname] || 'Alegra';

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const initials = user
    ? (user.name || user.email || 'U')
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      {/* Left: Page title */}
      <div>
        <h1 className="text-lg font-semibold text-gray-900">{pageTitle}</h1>
        {user?.company?.name && (
          <p className="text-xs text-gray-500">{user.company.name}</p>
        )}
      </div>

      {/* Right: Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
              {initials}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-sm font-medium text-gray-900 leading-tight">
                {user?.name || user?.email || 'Usuario'}
              </p>
              {user?.email && user?.name && (
                <p className="text-xs text-gray-500 leading-tight">{user.email}</p>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <User className="w-4 h-4 text-gray-400" />
                Mi Perfil
              </Link>
              <Link
                to="/settings"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Configuración
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

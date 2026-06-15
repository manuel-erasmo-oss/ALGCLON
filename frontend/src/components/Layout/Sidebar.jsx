import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Landmark,
  BarChart2,
  Settings,
} from 'lucide-react'

const navSections = [
  {
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    ],
  },
  {
    title: 'Ventas',
    items: [
      { label: 'Facturas', icon: FileText, to: '/invoices' },
      { label: 'Contactos', icon: Users, to: '/contacts' },
    ],
  },
  {
    title: 'Inventario',
    items: [
      { label: 'Productos', icon: Package, to: '/products' },
    ],
  },
  {
    title: 'Tesorería',
    items: [
      { label: 'Bancos', icon: Landmark, to: '/banks' },
    ],
  },
  {
    title: 'Reportes',
    items: [
      { label: 'Reportes', icon: BarChart2, to: '/reports' },
    ],
  },
  {
    title: 'Config',
    items: [
      { label: 'Configuración', icon: Settings, to: '/settings' },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-indigo-900 flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-indigo-800">
        <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
          <span className="text-white font-bold text-sm">A</span>
        </div>
        <span className="text-white font-semibold text-lg">Alegra</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section, idx) => (
          <div key={idx} className={idx > 0 ? 'mt-6' : ''}>
            {section.title && (
              <p className="px-3 mb-1 text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-700 text-white'
                          : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

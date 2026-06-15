import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Landmark,
  BarChart3,
  Settings,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  BookOpen,
  Receipt,
  UserCheck,
  ClipboardList,
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    name: 'Ventas',
    icon: Receipt,
    children: [
      { name: 'Facturas', href: '/invoices', icon: FileText },
      { name: 'Cotizaciones', href: '/invoices?type=quote', icon: ClipboardList },
      { name: 'Clientes', href: '/contacts?type=client', icon: UserCheck },
    ],
  },
  {
    name: 'Compras',
    href: '/purchases',
    icon: ShoppingCart,
  },
  {
    name: 'Productos',
    href: '/products',
    icon: Package,
  },
  {
    name: 'Bancos',
    href: '/banks',
    icon: Landmark,
  },
  {
    name: 'Contactos',
    href: '/contacts',
    icon: Users,
  },
  {
    name: 'Contabilidad',
    href: '/accounting',
    icon: BookOpen,
  },
  {
    name: 'Reportes',
    href: '/reports',
    icon: BarChart3,
  },
  {
    name: 'Configuración',
    href: '/settings',
    icon: Settings,
  },
];

function SidebarItem({ item }) {
  const location = useLocation();
  const [open, setOpen] = useState(() => {
    if (item.children) {
      return item.children.some((child) => location.pathname === child.href.split('?')[0]);
    }
    return false;
  });

  if (item.children) {
    const isActive = item.children.some(
      (child) => location.pathname === child.href.split('?')[0]
    );

    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`sidebar-item w-full ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span className="flex-1 text-left">{item.name}</span>
          {open ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        {open && (
          <div className="ml-4 mt-1 space-y-0.5 pl-4 border-l border-white/20">
            {item.children.map((child) => (
              <NavLink
                key={child.href}
                to={child.href}
                className={({ isActive: navActive }) =>
                  `sidebar-item ${navActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`
                }
              >
                <child.icon className="w-4 h-4 shrink-0" />
                <span>{child.name}</span>
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.href}
      end={item.href === '/'}
      className={({ isActive }) =>
        `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`
      }
    >
      <item.icon className="w-5 h-5 shrink-0" />
      <span>{item.name}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-primary-900 flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-white" />
        </div>
        <span className="text-white text-xl font-bold tracking-tight">Alegra</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => (
          <SidebarItem key={item.name} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-indigo-300 text-xs text-center">© 2024 Alegra Clone</p>
      </div>
    </aside>
  );
}

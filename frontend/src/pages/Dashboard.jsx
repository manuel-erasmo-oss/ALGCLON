import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  UserPlus,
  Package,
  FileText,
} from 'lucide-react';
import { getDashboardStats } from '../api/reports';
import { getInvoices } from '../api/invoices';
import { Badge } from '../components/UI/Badge';
import { Card } from '../components/UI/Card';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const mockChartData = [
  { month: 'Ene', ingresos: 4500000 },
  { month: 'Feb', ingresos: 5200000 },
  { month: 'Mar', ingresos: 3800000 },
  { month: 'Abr', ingresos: 6100000 },
  { month: 'May', ingresos: 7400000 },
  { month: 'Jun', ingresos: 5900000 },
];

function KPICard({ title, value, subtitle, icon: Icon, color }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.blue}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
    retry: false,
  });

  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices', { limit: 5 }],
    queryFn: () => getInvoices({ limit: 5 }),
    retry: false,
  });

  const invoices = invoicesData?.data || invoicesData || [];
  const recentInvoices = Array.isArray(invoices) ? invoices.slice(0, 5) : [];

  const kpis = [
    {
      title: 'Total Facturado',
      value: formatCurrency(stats?.totalInvoiced || 0),
      subtitle: 'Este mes',
      icon: TrendingUp,
      color: 'blue',
    },
    {
      title: 'Total Cobrado',
      value: formatCurrency(stats?.totalCollected || 0),
      subtitle: 'Pagos recibidos',
      icon: CheckCircle,
      color: 'green',
    },
    {
      title: 'Por Cobrar',
      value: formatCurrency(stats?.totalReceivable || 0),
      subtitle: 'Facturas pendientes',
      icon: Clock,
      color: 'yellow',
    },
    {
      title: 'Vencido',
      value: formatCurrency(stats?.totalOverdue || 0),
      subtitle: 'Requiere atención',
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <Card
          title="Ingresos últimos 6 meses"
          className="lg:col-span-2"
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chartData || mockChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  tickFormatter={(v) =>
                    new Intl.NumberFormat('es-CO', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(v)
                  }
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Ingresos']}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card title="Acciones Rápidas">
          <div className="space-y-3">
            <Link
              to="/invoices/new"
              className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors text-indigo-700 font-medium text-sm"
            >
              <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900">Nueva Factura</p>
                <p className="text-xs text-indigo-500 font-normal">Crear y enviar factura</p>
              </div>
            </Link>

            <Link
              to="/contacts?action=new"
              className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-green-700 font-medium text-sm"
            >
              <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900">Nuevo Cliente</p>
                <p className="text-xs text-green-500 font-normal">Registrar contacto</p>
              </div>
            </Link>

            <Link
              to="/products?action=new"
              className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl hover:bg-yellow-100 transition-colors text-yellow-700 font-medium text-sm"
            >
              <div className="w-9 h-9 bg-yellow-500 rounded-lg flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-yellow-900">Nuevo Producto</p>
                <p className="text-xs text-yellow-600 font-normal">Agregar al catálogo</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card
        title="Facturas Recientes"
        action={
          <Link to="/invoices" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Ver todas
          </Link>
        }
      >
        {invoicesLoading ? (
          <LoadingSpinner />
        ) : recentInvoices.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No hay facturas aún</p>
            <Link to="/invoices/new" className="text-sm text-indigo-600 hover:underline mt-1 block">
              Crear primera factura
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">Cliente</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">Fecha</th>
                  <th className="text-right text-xs font-semibold text-gray-500 uppercase pb-2 pr-4">Total</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 pr-4 text-sm font-medium text-indigo-600">
                      <Link to={`/invoices/${inv.id}`}>#{inv.number || inv.id}</Link>
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-gray-700">
                      {inv.contact?.name || inv.contactName || 'N/A'}
                    </td>
                    <td className="py-2.5 pr-4 text-sm text-gray-500">{formatDate(inv.date)}</td>
                    <td className="py-2.5 pr-4 text-sm font-medium text-gray-900 text-right">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="py-2.5 text-center">
                      <Badge variant={inv.status}>{inv.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

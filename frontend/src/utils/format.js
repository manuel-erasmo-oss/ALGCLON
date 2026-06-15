export const formatCOP = (amount) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount || 0)

export const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('es-CO') : '-'

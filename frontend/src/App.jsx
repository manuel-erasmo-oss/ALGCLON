import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import Layout from './components/Layout/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ContactsList from './pages/contacts/ContactsList'
import ContactDetail from './pages/contacts/ContactDetail'
import ProductsList from './pages/products/ProductsList'
import InvoicesList from './pages/invoices/InvoicesList'
import InvoiceForm from './pages/invoices/InvoiceForm'
import InvoiceDetail from './pages/invoices/InvoiceDetail'
import BanksList from './pages/banks/BanksList'
import BankDetail from './pages/banks/BankDetail'
import Reports from './pages/reports/Reports'
import Settings from './pages/settings/Settings'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="contacts" element={<ContactsList />} />
            <Route path="contacts/:id" element={<ContactDetail />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="invoices" element={<InvoicesList />} />
            <Route path="invoices/new" element={<InvoiceForm />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
            <Route path="invoices/:id/edit" element={<InvoiceForm />} />
            <Route path="banks" element={<BanksList />} />
            <Route path="banks/:id" element={<BankDetail />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
export default App

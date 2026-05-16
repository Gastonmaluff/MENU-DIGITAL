import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import BaristaPanel from './components/barista/BaristaPanel';
import CashierPanel from './components/cashier/CashierPanel';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLogin from './components/admin/AdminLogin';
import CategoryList from './components/admin/CategoryList';
import OrderList from './components/admin/OrderList';
import ProductList from './components/admin/ProductList';
import ProtectedRoute from './components/admin/ProtectedRoute';
import PublicViewEditor from './components/admin/PublicViewEditor';
import SettingsForm from './components/admin/SettingsForm';
import VariantGroupList from './components/admin/VariantGroupList';
import PublicMenu from './components/public/PublicMenu';
import { AuthProvider } from './hooks/useAuth';
import { USER_ROLES } from './utils/roles';
import './styles.css';

function App() {
  const routerBaseName = import.meta.env.DEV ? '/' : import.meta.env.BASE_URL;

  return (
    <BrowserRouter basename={routerBaseName}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<PublicMenu />} />
          <Route
            path="/barista"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.BARISTA]}>
                <BaristaPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cajera"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN, USER_ROLES.CASHIER]}>
                <CashierPanel />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<OrderList />} />
            <Route path="menu" element={<PublicViewEditor />} />
            <Route path="categories" element={<CategoryList />} />
            <Route path="products" element={<ProductList />} />
            <Route path="variants" element={<VariantGroupList />} />
            <Route path="appearance" element={<Navigate to="/admin/settings" replace />} />
            <Route path="settings" element={<SettingsForm />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

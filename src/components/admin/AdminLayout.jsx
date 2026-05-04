import {
  Brush,
  Coffee,
  Grid3X3,
  Home,
  Layers3,
  LogOut,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/admin', label: 'Dashboard', icon: Home, end: true },
  { to: '/admin/categories', label: 'Categorías', icon: Grid3X3 },
  { to: '/admin/products', label: 'Productos', icon: Coffee },
  { to: '/admin/variants', label: 'Variantes', icon: Layers3 },
  { to: '/admin/appearance', label: 'Apariencia', icon: Brush },
  { to: '/admin/settings', label: 'Configuración', icon: SlidersHorizontal },
];

export default function AdminLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Settings size={24} />
          <div>
            <strong>Nirvana Admin</strong>
            <span>Menú digital</span>
          </div>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="admin-ghost-button" type="button" onClick={handleLogout}>
          <LogOut size={18} />
          Salir
        </button>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}

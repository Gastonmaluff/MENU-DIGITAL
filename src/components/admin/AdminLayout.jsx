import {
  Home,
  LogOut,
  Settings,
  SlidersHorizontal,
  SquarePen,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/admin', label: 'Dashboard', icon: Home, end: true },
  { to: '/admin/menu', label: 'Editar vista pública', icon: SquarePen },
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

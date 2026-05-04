import {
  Home,
  LogOut,
  Menu,
  Settings,
  SlidersHorizontal,
  SquarePen,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/admin', label: 'Dashboard', icon: Home, end: true },
  { to: '/admin/menu', label: 'Editar vista pública', icon: SquarePen },
  { to: '/admin/settings', label: 'Configuración', icon: SlidersHorizontal },
];

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className={`admin-shell ${navOpen ? 'is-nav-open' : ''}`}>
      <header className="admin-topbar">
        <button className="admin-menu-button" type="button" onClick={() => setNavOpen(true)} aria-label="Abrir navegación">
          <Menu size={21} />
        </button>
        <div className="admin-brand admin-brand--top">
          <Settings size={22} />
          <div>
            <strong>Nirvana Admin</strong>
            <span>Menú digital</span>
          </div>
        </div>
      </header>

      <button className="admin-nav-backdrop" type="button" aria-label="Cerrar navegación" onClick={() => setNavOpen(false)} />

      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <div className="admin-brand">
            <Settings size={24} />
            <div>
              <strong>Nirvana Admin</strong>
              <span>Menú digital</span>
            </div>
          </div>
          <button className="admin-close-button" type="button" onClick={() => setNavOpen(false)} aria-label="Cerrar navegación">
            <X size={20} />
          </button>
        </div>
        <nav>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setNavOpen(false)}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <button className="admin-ghost-button" type="button" onClick={handleLogout}>
          <LogOut size={18} />
          Salir
        </button>
        <div className="admin-session-card">
          <span>Sesión activa</span>
          <strong>{user?.email || 'Usuario admin'}</strong>
        </div>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}

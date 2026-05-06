import {
  Home,
  LogOut,
  Menu,
  SlidersHorizontal,
  SquarePen,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSettings } from '../../hooks/useSettings';
import { resolveAssetUrl } from '../../utils/assets';

const links = [
  { to: '/admin', label: 'Dashboard', icon: Home, end: true },
  { to: '/admin/menu', label: 'Editar vista publica', icon: SquarePen },
  { to: '/admin/settings', label: 'Configuracion', icon: SlidersHorizontal },
];

function AdminBrand({ logoUrl }) {
  return (
    <div className="admin-brand">
      {logoUrl ? <img src={logoUrl} alt="Nirvana" /> : <strong>Nirvana</strong>}
    </div>
  );
}

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);
  const logoUrl = resolveAssetUrl(settings.logoUrl);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className={`admin-shell ${navOpen ? 'is-nav-open' : ''}`}>
      <header className="admin-topbar">
        <button className="admin-menu-button" type="button" onClick={() => setNavOpen(true)} aria-label="Abrir navegacion">
          <Menu size={21} />
        </button>
        <div className="admin-brand--top">
          <AdminBrand logoUrl={logoUrl} />
        </div>
      </header>

      <button className="admin-nav-backdrop" type="button" aria-label="Cerrar navegacion" onClick={() => setNavOpen(false)} />

      <aside className="admin-sidebar">
        <div className="admin-sidebar-head">
          <AdminBrand logoUrl={logoUrl} />
          <button className="admin-close-button" type="button" onClick={() => setNavOpen(false)} aria-label="Cerrar navegacion">
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
          <span>Sesion activa</span>
          <strong>{user?.email || 'Usuario admin'}</strong>
        </div>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}

import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getHomePathForRole } from '../../utils/roles';

export default function AdminLogin() {
  const { login, logout, user, isReady, role, profile, profileError, profileLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from || getHomePathForRole(role);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user && profileLoading) {
    return (
      <main className="admin-public-screen">
        <div className="admin-login-card">
          <span className="admin-login-icon"><Lock size={24} /></span>
          <h1>Verificando permisos</h1>
          <p>Estamos cargando tu perfil operativo.</p>
        </div>
      </main>
    );
  }

  if (user && (!profile || profile.active !== true || !role)) {
    return (
      <main className="admin-public-screen">
        <div className="admin-login-card">
          <span className="admin-login-icon"><Lock size={24} /></span>
          <h1>Acceso pendiente</h1>
          <p>Tu usuario necesita un perfil activo en Firestore para entrar al sistema.</p>
          {profileError && <div className="admin-error">{profileError}</div>}
          <button className="admin-secondary-button" type="button" onClick={logout}>Salir</button>
        </div>
      </main>
    );
  }

  if (user) return <Navigate to={redirectTo} replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo);
    } catch (err) {
      setError('No pudimos iniciar sesión. Revisá email y contraseña.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="admin-public-screen">
      <form className="admin-login-card" onSubmit={submit}>
        <span className="admin-login-icon"><Lock size={24} /></span>
        <h1>Panel admin</h1>
        <p>Ingresá con el usuario creado en Firebase Auth.</p>
        {!isReady && <div className="admin-error">Faltan variables Firebase en `.env`.</div>}
        {error && <div className="admin-error">{error}</div>}
        <label>
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
        </label>
        <button className="admin-primary-button" type="submit" disabled={loading || !isReady}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </main>
  );
}

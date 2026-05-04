import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLogin() {
  const { login, user, isReady } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin');
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

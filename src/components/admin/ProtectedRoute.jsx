import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function ProtectedRoute({ children }) {
  const { user, loading, authReady, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="admin-public-screen">
        <div className="admin-login-card">
          <h1>Firebase no está configurado</h1>
          <p>Completá las variables `.env` para activar el panel admin.</p>
        </div>
      </div>
    );
  }

  if (loading && !authReady) {
    return (
      <div className="admin-public-screen">
        <div className="admin-login-card">
          <h1>Verificando sesión</h1>
          <p>Esto debería tardar solo un momento.</p>
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/admin/login" replace />;
  return children;
}

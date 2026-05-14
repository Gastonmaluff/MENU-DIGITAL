import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getHomePathForRole } from '../../utils/roles';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, authReady, isReady, profile, role, profileLoading, profileError } = useAuth();
  const location = useLocation();

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
  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;

  if (profileLoading) {
    return (
      <div className="admin-public-screen">
        <div className="admin-login-card">
          <h1>Verificando permisos</h1>
          <p>Estamos cargando el perfil operativo del usuario.</p>
        </div>
      </div>
    );
  }

  if (profileError || !profile || profile.active !== true || !role) {
    return (
      <div className="admin-public-screen">
        <div className="admin-login-card">
          <h1>Acceso pendiente</h1>
          <p>Tu usuario necesita un perfil activo en Firestore para entrar al sistema.</p>
          {profileError && <div className="admin-error">{profileError}</div>}
        </div>
      </div>
    );
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    const homePath = getHomePathForRole(role);
    if (homePath !== location.pathname && homePath !== '/') return <Navigate to={homePath} replace />;

    return (
      <div className="admin-public-screen">
        <div className="admin-login-card">
          <h1>Sin permisos</h1>
          <p>Tu rol actual no tiene acceso a esta sección.</p>
        </div>
      </div>
    );
  }

  return children;
}

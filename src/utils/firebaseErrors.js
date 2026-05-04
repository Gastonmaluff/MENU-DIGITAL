export const isAuthErrorCode = (code = '') =>
  code === 'auth/unauthenticated' || code === 'auth/no-current-user';

export const isPermissionErrorCode = (code = '') =>
  code === 'permission-denied' || code === 'storage/unauthorized';

export const formatFirebaseWriteError = (error) => {
  const code = error?.code || '';
  const message = error?.message || '';

  if (isAuthErrorCode(code)) {
    return 'No tenés permisos para guardar. Iniciá sesión como administrador.';
  }

  if (isPermissionErrorCode(code) || message.includes('Missing or insufficient permissions')) {
    return 'Firebase rechazó la escritura. Revisá reglas de Firestore/Storage y confirmá que tu usuario admin esté autenticado.';
  }

  return message || 'No se pudo guardar el cambio en Firebase.';
};

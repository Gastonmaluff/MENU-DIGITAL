export const USER_ROLES = {
  ADMIN: 'admin',
  BARISTA: 'barista',
  CASHIER: 'cashier',
};

export const getHomePathForRole = (role) => {
  if (role === USER_ROLES.ADMIN) return '/admin';
  if (role === USER_ROLES.BARISTA) return '/barista';
  if (role === USER_ROLES.CASHIER) return '/cajera';
  return '/';
};

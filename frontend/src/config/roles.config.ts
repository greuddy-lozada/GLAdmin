export const rolesConfig = {
  master: {
    label: 'Master',
    modules: ['dashboard', 'users', 'customers', 'suppliers', 'companies', 'products', 'taxes', 'batches', 'stocks', 'purchase-orders', 'foreign-exchanges', 'roles', 'settings'],
  },
  admin: {
    label: 'Administrador',
    modules: ['dashboard', 'users', 'customers', 'suppliers', 'companies', 'products', 'taxes', 'batches', 'stocks', 'purchase-orders', 'foreign-exchanges', 'roles', 'settings'],
  },
  employee: {
    label: 'Empleado',
    modules: ['dashboard', 'customers', 'suppliers'],
  },
};

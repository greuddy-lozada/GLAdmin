import {
  LayoutDashboard,
  Users,
  UserCog,
  Store,
  Building2,
  Receipt,
  Package,
  Tags,
  Truck,
  ShoppingCart,
  ArrowLeftRight,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  roles: string[];
}

export const navigationConfig: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', roles: ['master', 'admin', 'employee'] },
  { key: 'users', label: 'Usuarios', icon: Users, path: '/users', roles: ['master', 'admin'] },
  { key: 'customers', label: 'Clientes', icon: UserCog, path: '/customers', roles: ['master', 'admin', 'employee'] },
  { key: 'suppliers', label: 'Proveedores', icon: Truck, path: '/suppliers', roles: ['master', 'admin', 'employee'] },
  { key: 'companies', label: 'Empresas', icon: Building2, path: '/companies', roles: ['master', 'admin'] },
  { key: 'products', label: 'Productos', icon: Package, path: '/products', roles: ['master', 'admin', 'employee'] },
  { key: 'taxes', label: 'Impuestos', icon: Receipt, path: '/taxes', roles: ['master', 'admin', 'employee'] },
  { key: 'batches', label: 'Lotes', icon: Tags, path: '/batches', roles: ['master', 'admin', 'employee'] },
  { key: 'stocks', label: 'Inventario', icon: Store, path: '/stocks', roles: ['master', 'admin', 'employee'] },
  { key: 'purchaseOrders', label: 'Pedidos', icon: ShoppingCart, path: '/purchase-orders', roles: ['master', 'admin', 'employee'] },
  { key: 'foreignExchanges', label: 'Tasa Cambio', icon: ArrowLeftRight, path: '/foreign-exchanges', roles: ['master', 'admin'] },
  { key: 'roles', label: 'Roles', icon: ShieldCheck, path: '/roles', roles: ['master', 'admin'] },
  { key: 'settings', label: 'Configuración', icon: Settings, path: '/settings', roles: ['master', 'admin'] },
];

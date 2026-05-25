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
  DollarSign,
  FileText,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  minLevel: number;
}

export interface NavGroup {
  key?: string;
  label?: string;
  items: NavItem[];
}

export const navigationGroups: NavGroup[] = [
  {
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', minLevel: 40 },
    ],
  },
  {
    key: 'compras',
    label: 'nav.group.compras',
    items: [
      { key: 'suppliers', label: 'Proveedores', icon: Truck, path: '/suppliers', minLevel: 40 },
      { key: 'purchaseOrders', label: 'Pedidos', icon: ShoppingCart, path: '/purchase-orders', minLevel: 40 },
      { key: 'withholdings', label: 'Retenciones', icon: FileText, path: '/withholdings', minLevel: 40 },
      { key: 'exchangeRates', label: 'Tasas BCV', icon: DollarSign, path: '/exchange-rates', minLevel: 40 },
    ],
  },
  {
    key: 'inventario',
    label: 'nav.group.inventario',
    items: [
      { key: 'products', label: 'Productos', icon: Package, path: '/products', minLevel: 40 },
      { key: 'taxes', label: 'Impuestos', icon: Receipt, path: '/taxes', minLevel: 40 },
      { key: 'batches', label: 'Lotes', icon: Tags, path: '/batches', minLevel: 40 },
      { key: 'stocks', label: 'Inventario', icon: Store, path: '/stocks', minLevel: 40 },
    ],
  },
  {
    key: 'ventas',
    label: 'nav.group.ventas',
    items: [
      { key: 'customers', label: 'Clientes', icon: UserCog, path: '/customers', minLevel: 40 },
    ],
  },
  {
    key: 'admin',
    label: 'nav.group.admin',
    items: [
      { key: 'users', label: 'Usuarios', icon: Users, path: '/users', minLevel: 80 },
      { key: 'companies', label: 'Empresas', icon: Building2, path: '/companies', minLevel: 80 },
      { key: 'roles', label: 'Roles', icon: ShieldCheck, path: '/roles', minLevel: 60 },
    ],
  },
  {
    key: 'config',
    label: 'nav.group.config',
    items: [
      { key: 'settings', label: 'Configuración', icon: Settings, path: '/settings', minLevel: 60 },
    ],
  },
];

export const navigationConfig: NavItem[] = navigationGroups.flatMap((g) => g.items);

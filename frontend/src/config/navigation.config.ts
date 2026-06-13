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
  Settings,
  ShieldCheck,
  CreditCard,
  Mail,
  ArrowLeftRight,
  Wallet,
  AlertCircle,
  Keyboard,
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
    key: 'main',
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
      { key: 'exchangeRates', label: 'Tasas BCV', icon: DollarSign, path: '/exchange-rates', minLevel: 40 },
    ],
  },
  {
    key: 'inventario',
    label: 'nav.group.inventario',
    items: [
      { key: 'products', label: 'Productos', icon: Package, path: '/products', minLevel: 40 },
      { key: 'categories', label: 'Categorías', icon: Tags, path: '/categories', minLevel: 40 },
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
      { key: 'pos', label: 'POS', icon: ShoppingCart, path: '/pos', minLevel: 40 },
    ],
  },
  {
    key: 'admin',
    label: 'nav.group.admin',
    items: [
      { key: 'users', label: 'Usuarios', icon: Users, path: '/users', minLevel: 80 },
      { key: 'companies', label: 'Empresas', icon: Building2, path: '/companies', minLevel: 80 },
      { key: 'roles', label: 'Roles', icon: ShieldCheck, path: '/roles', minLevel: 60 },
      { key: 'adminOrganizations', label: 'Organizaciones', icon: Building2, path: '/admin/organizations', minLevel: 80 },
      { key: 'adminUsers', label: 'Usuarios Admin', icon: Users, path: '/admin/users', minLevel: 80 },
      { key: 'adminPlans', label: 'Planes', icon: CreditCard, path: '/admin/plans', minLevel: 80 },
      { key: 'adminInvites', label: 'Invitaciones', icon: Mail, path: '/admin/invites', minLevel: 80 },
    ],
  },
  {
    key: 'config',
    label: 'nav.group.config',
    items: [
      { key: 'settings', label: 'Configuración', icon: Settings, path: '/settings', minLevel: 60 },
      { key: 'shortcuts', label: 'Shortcuts', icon: Keyboard, path: '/settings/shortcuts', minLevel: 40 },
      { key: 'payments', label: 'Pagos', icon: Wallet, path: '/settings/payments', minLevel: 60 },
      { key: 'transactions', label: 'Transacciones', icon: ArrowLeftRight, path: '/settings/payments/transactions', minLevel: 40 },
      { key: 'billing', label: 'Facturación', icon: CreditCard, path: '/billing', minLevel: 40 },
      { key: 'syncConflicts', label: 'Sync Conflicts', icon: AlertCircle, path: '/settings/sync/conflicts', minLevel: 60 },
    ],
  },
];

export const navigationConfig: NavItem[] = navigationGroups.flatMap((g) => g.items);

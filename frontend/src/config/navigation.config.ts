import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GroupIcon from '@mui/icons-material/Group';
import StoreIcon from '@mui/icons-material/Store';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InventoryIcon from '@mui/icons-material/Inventory';
import CategoryIcon from '@mui/icons-material/Category';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import SettingsIcon from '@mui/icons-material/Settings';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

export interface NavItem {
  key: string;
  label: string;
  icon: React.ComponentType;
  path: string;
  roles: string[];
}

export const navigationConfig: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: DashboardIcon, path: '/dashboard', roles: ['master', 'admin', 'employee'] },
  { key: 'users', label: 'Usuarios', icon: PeopleIcon, path: '/users', roles: ['master', 'admin'] },
  { key: 'customers', label: 'Clientes', icon: GroupIcon, path: '/customers', roles: ['master', 'admin', 'employee'] },
  { key: 'suppliers', label: 'Proveedores', icon: LocalShippingIcon, path: '/suppliers', roles: ['master', 'admin', 'employee'] },
  { key: 'companies', label: 'Empresas', icon: BusinessIcon, path: '/companies', roles: ['master', 'admin'] },
  { key: 'products', label: 'Productos', icon: InventoryIcon, path: '/products', roles: ['master', 'admin', 'employee'] },
  { key: 'taxes', label: 'Impuestos', icon: ReceiptIcon, path: '/taxes', roles: ['master', 'admin', 'employee'] },
  { key: 'batches', label: 'Lotes', icon: CategoryIcon, path: '/batches', roles: ['master', 'admin', 'employee'] },
  { key: 'stocks', label: 'Inventario', icon: StoreIcon, path: '/stocks', roles: ['master', 'admin', 'employee'] },
  { key: 'purchaseOrders', label: 'Pedidos', icon: ShoppingCartIcon, path: '/purchase-orders', roles: ['master', 'admin', 'employee'] },
  { key: 'foreignExchanges', label: 'Tasa Cambio', icon: CurrencyExchangeIcon, path: '/foreign-exchanges', roles: ['master', 'admin'] },
  { key: 'roles', label: 'Roles', icon: VerifiedUserIcon, path: '/roles', roles: ['master', 'admin'] },
  { key: 'settings', label: 'Configuración', icon: SettingsIcon, path: '/settings', roles: ['master', 'admin'] },
];

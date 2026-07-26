import { describe, expect, vi, beforeEach, it } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import ProductsPage from '@/features/products/components/products-page';

vi.mock('@/i18n', () => ({
  useI18n: () => ({ t: (k: string) => k, tp: (k: string) => k }),
}));

vi.mock('@/providers/auth-provider', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api/api-client', () => ({
  default: {
    get: vi.fn().mockReturnValue(new Promise(() => {})),
    post: vi.fn().mockReturnValue(new Promise(() => {})),
  },
}));

vi.mock('@/features/exchange-rates/services/exchange-rate.service', () => ({
  exchangeRateService: { getLatest: vi.fn().mockReturnValue(new Promise(() => {})) },
}));

vi.mock('sileo', () => ({
  sileo: { success: vi.fn() },
}));

const mockRemoveMutate = vi.fn();

vi.mock('@/features/products/hooks/use-products', () => ({
  useProducts: vi.fn(),
}));

import { useAuth } from '@/providers/auth-provider';
import { useProducts } from '@/features/products/hooks/use-products';

const mockUseAuth = vi.mocked(useAuth);
const mockUseProducts = vi.mocked(useProducts);

const sampleProducts = [
  {
    id: '1',
    code: 'P001',
    name: 'Product 1',
    price: 100,
    dollarPrice: 10,
    margin: 20,
    available: true,
    stock: 50,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: '2',
    code: 'P002',
    name: 'Product 2',
    price: 200,
    dollarPrice: 20,
    margin: 15,
    available: true,
    stock: 30,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

function mockMasterRole() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (mockUseAuth as any).mockReturnValue({
    user: { role: { id: '1', name: 'Master', slug: 'master' } },
    token: 'token',
    isAuthenticated: true,
    isLoading: false,
    organizations: [],
    currentOrg: null,
    effectiveRoleSlug: 'master',
    login: vi.fn(),
    logout: vi.fn(),
    selectOrg: vi.fn(),
  });
}

function mockProductsLoaded(overrides?: Partial<ReturnType<typeof useProducts>>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const value: any = {
    items: sampleProducts,
    isLoading: false,
    create: { mutate: vi.fn(), isPending: false },
    update: { mutate: vi.fn(), isPending: false },
    remove: { mutate: mockRemoveMutate, isPending: false },
    ...overrides,
  };
  mockUseProducts.mockReturnValue(value);
}

describe('ProductsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMasterRole();
    mockProductsLoaded();
  });

  it('renders DataTable with products', async () => {
    render(<ProductsPage />);

    await waitFor(() => {
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
    });
  });

  it('shows loading skeleton while fetching', () => {
    mockProductsLoaded({ items: [], isLoading: true });

    render(<ProductsPage />);

    expect(screen.queryByText('Product 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
  });

  it('opens SlideForm on "Crear" button click', async () => {
    render(<ProductsPage />);

    const createButton = screen.getByRole('button', { name: 'products.new' });
    fireEvent.click(createButton);

    await waitFor(() => {
      const titles = screen.getAllByText('products.new');
      expect(titles.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('calls delete with string ID on delete action', async () => {
    render(<ProductsPage />);

    const deleteButtons = screen.getAllByRole('button', { name: 'common.delete' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('products.delete')).toBeInTheDocument();
    });

    const dialog = screen.getByRole('dialog');
    const confirmButton = within(dialog).getByRole('button', { name: 'common.delete' });
    fireEvent.click(confirmButton);

    expect(mockRemoveMutate).toHaveBeenCalledWith('1', expect.any(Object));
  });
});

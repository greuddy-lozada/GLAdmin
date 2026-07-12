import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '@/features/auth/components/login-form';

vi.mock('@/i18n', () => ({
  useI18n: () => ({ t: (k: string) => k, tp: (k: string) => k }),
}));

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockLogin = vi.fn();
vi.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock('@/features/auth/services/auth.service', () => ({
  authService: { login: vi.fn() },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email and password inputs', () => {
    render(<LoginForm />);

    const emailInput = screen.getByLabelText('auth.email');
    const passwordInput = screen.getByLabelText('auth.password');

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveAttribute('required');

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('shows validation errors on empty submit', () => {
    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: 'auth.loginButton' });
    fireEvent.click(submitButton);

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('calls login API on valid submit', async () => {
    mockLogin.mockResolvedValueOnce({ organizations: [] });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'auth.loginButton' }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  it('shows error message on API failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'));
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'wrong' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'auth.loginButton' }));

    await waitFor(() => {
      expect(screen.getByText('auth.error')).toBeInTheDocument();
    });
  });

  it('redirects on successful login', async () => {
    mockLogin.mockResolvedValueOnce({ organizations: [] });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText('auth.email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText('auth.password'), {
      target: { value: 'password123' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'auth.loginButton' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });
});

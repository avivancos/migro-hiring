import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { AdminLogin } from '@/pages/AdminLogin';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';

// Mock de window.location
Object.defineProperty(window, 'location', {
  value: {
    pathname: '/auth/login',
    href: 'http://localhost:5173/auth/login',
  },
  writable: true,
});

// Mock de react-router-dom
const mockNavigate = vi.fn();
const mockUseSearchParams = vi.fn(() => [new URLSearchParams(), vi.fn()]);

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockUseSearchParams(),
  };
});

// Mock de AuthProvider
const mockLogin = vi.fn();
let mockIsAuthenticated = false;
let mockIsAdmin = false;

vi.mock('@/providers/AuthProvider', async () => {
  const actual = await vi.importActual('@/providers/AuthProvider');
  return {
    ...actual,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
    useAuth: () => ({
      login: mockLogin,
      isAuthenticated: mockIsAuthenticated,
      isAdmin: mockIsAdmin,
      user: null,
      logout: vi.fn(),
      refreshUser: vi.fn(),
      isLoading: false,
    }),
  };
});

describe('AdminLogin - Tests Automatizados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockLogin.mockClear();
  });

  it('debe renderizar el formulario de login', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^acceder$/i })).toBeInTheDocument();
  });

  it('debe mostrar error si los campos están vacíos', async () => {
    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /^acceder$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/por favor.*email y contraseña/i)).toBeInTheDocument();
    }, { container });
  });

  it('debe llamar a login con credenciales agusvc@gmail.com / pomelo2005', async () => {
    mockLogin.mockResolvedValue(undefined);
    mockIsAuthenticated = false;
    mockIsAdmin = false;

    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    
    fireEvent.change(emailInput, { target: { value: 'agusvc@gmail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'pomelo2005' } });

    const submitButton = screen.getByRole('button', { name: /^acceder$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('agusvc@gmail.com', 'pomelo2005');
    }, { container, timeout: 3000 });
  });

  it('debe mostrar error si las credenciales son incorrectas', async () => {
    const error = new Error('Credenciales incorrectas');
    (error as any).response = { data: { detail: 'Credenciales incorrectas' } };
    mockLogin.mockRejectedValue(error);
    mockIsAuthenticated = false;
    mockIsAdmin = false;

    const { container } = render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/contraseña/i);
    
    fireEvent.change(emailInput, { target: { value: 'agusvc@gmail.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password-incorrecto' } });

    const submitButton = screen.getByRole('button', { name: /^acceder$/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      const errorText = screen.queryByText(/credenciales incorrectas/i) || 
                        screen.queryByText(/error al iniciar sesión/i) ||
                        screen.queryByText(/verifica tus credenciales/i);
      expect(errorText).toBeInTheDocument();
    }, { container, timeout: 3000 });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

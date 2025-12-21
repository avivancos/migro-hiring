import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLogin } from '@/pages/AdminLogin';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/providers/AuthProvider';

// Mock de react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock de adminService usando factory function
vi.mock('@/services/adminService', () => {
  const mockLogin = vi.fn();
  const mockIsAuthenticated = vi.fn();
  const mockLogout = vi.fn();
  
  return {
    adminService: {
      login: mockLogin,
      isAuthenticated: mockIsAuthenticated,
      logout: mockLogout,
    },
  };
});

import { adminService } from '@/services/adminService';

describe('AdminLogin - Tests Automatizados', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminService.isAuthenticated).mockReturnValue(false);
    // Limpiar el DOM antes de cada test
    document.body.innerHTML = '';
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
    expect(screen.getByRole('button', { name: /acceder/i })).toBeInTheDocument();
  });

  it('debe mostrar error si los campos están vacíos', async () => {
    const user = userEvent.setup();
    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    const submitButtons = screen.getAllByRole('button', { name: /acceder/i });
    await user.click(submitButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/por favor.*email y contraseña/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a login con credenciales agusvc@gmail.com / pomelo2005', async () => {
    const user = userEvent.setup();
    vi.mocked(adminService.login).mockResolvedValue({
      success: true,
      token: 'test-token',
      user: { id: 1, email: 'agusvc@gmail.com', role: 'admin', is_admin: true },
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'agusvc@gmail.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'pomelo2005');

    const submitButtons = screen.getAllByRole('button', { name: /acceder/i });
    await user.click(submitButtons[0]);

    await waitFor(() => {
      expect(adminService.login).toHaveBeenCalledWith('agusvc@gmail.com', 'pomelo2005');
      expect(mockNavigate).toHaveBeenCalledWith('/contrato/dashboard');
    });
  });

  it('debe mostrar error si las credenciales son incorrectas', async () => {
    const user = userEvent.setup();
    vi.mocked(adminService.login).mockResolvedValue({
      success: false,
      error: 'Credenciales incorrectas',
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <AdminLogin />
        </AuthProvider>
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'agusvc@gmail.com');
    await user.type(screen.getByLabelText(/contraseña/i), 'password-incorrecto');

    const submitButtons = screen.getAllByRole('button', { name: /acceder/i });
    await user.click(submitButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

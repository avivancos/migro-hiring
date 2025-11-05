import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLogin } from '@/pages/AdminLogin';
import { mockAdminService } from '../../test/mockData';
import { BrowserRouter } from 'react-router-dom';

// Mock de servicios
vi.mock('@/services/adminService', () => ({
  adminService: mockAdminService,
}));

// Mock de navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminLogin - Tests de Integración', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAdminService.isAuthenticated.mockReturnValue(false);
    mockAdminService.login.mockResolvedValue({ 
      success: true, 
      token: 'mock-token', 
      user: { id: 1, email: 'admin@test.com', role: 'admin', is_admin: true } 
    });
  });

  describe('Renderizado del formulario', () => {
    it('debe renderizar los campos de email y contraseña', () => {
      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /acceder/i })).toBeInTheDocument();
    });

    it('debe mostrar el título del panel de administración', () => {
      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      expect(screen.getByText(/panel de administración/i)).toBeInTheDocument();
      expect(screen.getByText(/migro.*sistema de contratación/i)).toBeInTheDocument();
    });
  });

  describe('Validación del formulario', () => {
    it('debe mostrar error si los campos están vacíos', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      const submitButton = screen.getByRole('button', { name: /acceder/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/por favor.*email y contraseña/i)).toBeInTheDocument();
      });
    });

    it('debe validar formato de email', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'email-invalido');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');

      const emailField = emailInput as HTMLInputElement;
      expect(emailField.validity.valid).toBe(false);
    });
  });

  describe('Proceso de login', () => {
    it('debe llamar a adminService.login con credenciales correctas', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /acceder/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAdminService.login).toHaveBeenCalledWith('admin@test.com', 'password123');
      });
    });

    it('debe redirigir a /admin/crm cuando el login es exitoso con usuario admin', async () => {
      const user = userEvent.setup();
      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /acceder/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin/crm');
      });
    });

    it('debe mostrar error si las credenciales son incorrectas', async () => {
      const user = userEvent.setup();
      mockAdminService.login.mockResolvedValue({ success: false });

      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password-incorrecto');

      const submitButton = screen.getByRole('button', { name: /acceder/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('debe mostrar error si el usuario no es admin', async () => {
      const user = userEvent.setup();
      mockAdminService.login.mockResolvedValue({ 
        success: true, 
        token: 'mock-token', 
        user: { id: 1, email: 'user@test.com', role: 'user', is_admin: false } 
      });

      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email/i), 'user@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /acceder/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/no tienes permisos de administrador/i)).toBeInTheDocument();
      });

      expect(mockAdminService.logout).toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('debe mostrar estado de carga durante el login', async () => {
      const user = userEvent.setup();
      let resolveLogin: (value: any) => void;
      const loginPromise = new Promise(resolve => {
        resolveLogin = resolve;
      });

      mockAdminService.login.mockReturnValue(loginPromise);

      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /acceder/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/verificando/i)).toBeInTheDocument();
      });

      resolveLogin!({ success: true, token: 'mock-token', user: { role: 'admin', is_admin: true } });
    });

    it('debe limpiar errores al escribir en los campos', async () => {
      const user = userEvent.setup();
      mockAdminService.login.mockResolvedValue({ success: false });

      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
      await user.type(screen.getByLabelText(/contraseña/i), 'wrong');

      const submitButton = screen.getByRole('button', { name: /acceder/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/credenciales incorrectas/i)).toBeInTheDocument();
      });

      // Escribir de nuevo debe limpiar el error
      await user.type(screen.getByLabelText(/email/i), 'x');

      await waitFor(() => {
        expect(screen.queryByText(/credenciales incorrectas/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Navegación', () => {
    it('debe tener botón para volver al inicio', () => {
      render(
        <BrowserRouter>
          <AdminLogin />
        </BrowserRouter>
      );

      const backButton = screen.getByRole('button', { name: /volver al inicio/i });
      expect(backButton).toBeInTheDocument();
    });
  });
});


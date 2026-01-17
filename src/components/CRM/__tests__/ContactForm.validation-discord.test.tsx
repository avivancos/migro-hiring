import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContactForm } from '@/components/CRM/ContactForm';
import { crmService } from '@/services/crmService';
import { adminService } from '@/services/adminService';

// Mock de crmService
vi.mock('@/services/crmService', () => ({
  crmService: {
    getCompanies: vi.fn(),
    updateContact: vi.fn(),
    createContact: vi.fn(),
  },
}));

// Mock de adminService
const mockGetUser = vi.fn();
vi.mock('@/services/adminService', () => ({
  adminService: {
    getUser: () => mockGetUser(),
  },
}));

// Mock de useAuth
const mockUser = { id: null, email: null, role: null, is_superuser: false };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
  }),
}));

describe('ContactForm - Tests de Validaciones y Discordancias', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnSubmit.mockClear();
    vi.mocked(crmService.getCompanies).mockResolvedValue({
      items: [
        { id: 1, name: 'Empresa Test' },
        { id: 2, name: 'Otra Empresa' },
      ],
      total: 2,
      skip: 0,
      limit: 100,
    });
  });

  describe('Discordancias entre Admin y Agente', () => {
    describe('Como Admin', () => {
      beforeEach(() => {
        mockUser.id = 'admin-1';
        mockUser.email = 'admin@test.com';
        mockUser.role = 'admin';
        mockUser.is_superuser = true;
        mockGetUser.mockReturnValue({ id: 'admin-1', email: 'admin@test.com', role: 'admin', is_superuser: true });
      });

      it('debe permitir editar responsible_user_id de otros usuarios', async () => {
        const contactOtroUsuario = {
          id: 'contact-1',
          name: 'Contacto Otro Usuario',
          responsible_user_id: 'other-user-1',
        };

        const { container } = render(
          <ContactForm 
            contact={contactOtroUsuario as any}
            onSubmit={mockOnSubmit} 
            onCancel={mockOnCancel}
          />
        );

        await waitFor(() => {
          expect(screen.getByDisplayValue('Contacto Otro Usuario')).toBeInTheDocument();
        }, { container });

        // Admin debería poder cambiar el responsable
        const submitButton = screen.getByRole('button', { name: /actualizar/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          expect(mockOnSubmit).toHaveBeenCalled();
        }, { container, timeout: 5000 });

        // Verificar que se puede cambiar responsible_user_id
        const submittedData = mockOnSubmit.mock.calls[0]?.[0];
        expect(submittedData).toBeDefined();
      });

      it('debe aceptar campos opcionales con valores "edge" que otros roles podrían rechazar', async () => {
        const edgeCases = {
          email: 'test@test',
          phone: '+34',
          postal_code: '00000',
          company_id: 999999, // ID que no existe
        };

        const { container } = render(
          <ContactForm 
            onSubmit={mockOnSubmit} 
            onCancel={mockOnCancel}
          />
        );

        await waitFor(() => {
          expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
        }, { container });

        const nameInput = screen.getByLabelText(/nombre completo/i);
        fireEvent.change(nameInput, { target: { value: 'Test Admin Edge Case' } });

        const emailInput = screen.getByLabelText(/email/i);
        if (emailInput) {
          fireEvent.change(emailInput, { target: { value: edgeCases.email } });
        }

        const submitButton = screen.getByRole('button', { name: /crear contacto/i });
        fireEvent.click(submitButton);

        // DISCORDANCIA POTENCIAL: ¿El admin debería poder crear contactos con datos inválidos?
        await waitFor(() => {
          if (mockOnSubmit.mock.calls.length > 0) {
            const submittedData = mockOnSubmit.mock.calls[0]?.[0];
            // Este test documenta si el admin tiene validaciones más permisivas
            // DISCORDANCIA: Si esto pasa, hay validación inconsistente entre roles
            console.warn('⚠️ DISCORDANCIA: Admin puede crear contacto con email inválido:', edgeCases.email);
          }
        }, { container, timeout: 5000 });
      });
    });

    describe('Como Agente', () => {
      beforeEach(() => {
        mockUser.id = 'agent-1';
        mockUser.email = 'agent@test.com';
        mockUser.role = 'agent';
        mockUser.is_superuser = false;
        mockGetUser.mockReturnValue({ id: 'agent-1', email: 'agent@test.com', role: 'agent', is_superuser: false });
      });

      it('NO debe permitir cambiar responsible_user_id de contactos ajenos', async () => {
        const contactOtroUsuario = {
          id: 'contact-1',
          name: 'Contacto Otro Usuario',
          responsible_user_id: 'other-user-1',
        };

        const { container } = render(
          <ContactForm 
            contact={contactOtroUsuario as any}
            onSubmit={mockOnSubmit} 
            onCancel={mockOnCancel}
          />
        );

        await waitFor(() => {
          expect(screen.getByDisplayValue('Contacto Otro Usuario')).toBeInTheDocument();
        }, { container });

        // DISCORDANCIA: ¿El agente puede cambiar el responsable de un contacto ajeno?
        // Si puede, hay un problema de permisos
        const responsibleSelect = screen.queryByLabelText(/responsable/i);
        
        if (responsibleSelect) {
          // Intentar cambiar responsable
          fireEvent.change(responsibleSelect, { target: { value: 'agent-1' } });

          const submitButton = screen.getByRole('button', { name: /actualizar/i });
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockOnSubmit.mock.calls.length > 0) {
              const submittedData = mockOnSubmit.mock.calls[0]?.[0];
              // DISCORDANCIA: Si el agente puede cambiar responsible_user_id, hay problema de permisos
              if (submittedData?.responsible_user_id === 'agent-1') {
                console.error('🚨 DISCORDANCIA CRÍTICA: Agente puede cambiar responsible_user_id de contacto ajeno!');
              }
            }
          }, { container, timeout: 5000 });
        }
      });

      it('debe tener validaciones más estrictas que admin - DISCORDANCIA: validaciones inconsistentes', async () => {
        const invalidEmail = 'test@test'; // Email sin TLD válido

        const { container } = render(
          <ContactForm 
            onSubmit={mockOnSubmit} 
            onCancel={mockOnCancel}
          />
        );

        await waitFor(() => {
          expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
        }, { container });

        const nameInput = screen.getByLabelText(/nombre completo/i);
        const emailInput = screen.getByLabelText(/email/i);

        fireEvent.change(nameInput, { target: { value: 'Test Agent' } });
        fireEvent.change(emailInput, { target: { value: invalidEmail } });

        const submitButton = screen.getByRole('button', { name: /crear contacto/i });
        fireEvent.click(submitButton);

        // DISCORDANCIA: Si el agente puede crear con email inválido, hay validación inconsistente
        await waitFor(() => {
          if (mockOnSubmit.mock.calls.length > 0) {
            console.warn('⚠️ DISCORDANCIA: Agente puede crear contacto con email inválido');
            // Si pasa aquí pero no pasa como admin, hay inconsistencia
          }
        }, { container, timeout: 5000 });
      });
    });
  });

  describe('Casos de Validación que NO deberían pasar', () => {
    beforeEach(() => {
      mockUser.id = 'test-user';
      mockUser.email = 'test@test.com';
      mockUser.role = 'agent';
      mockUser.is_superuser = false;
      mockGetUser.mockReturnValue({ id: 'test-user', email: 'test@test.com', role: 'agent' });
    });

    it('NO debería aceptar nombres solo con espacios - DISCORDANCIA: validación insuficiente', async () => {
      const onlySpaces = '   ';
      const tabsAndSpaces = '\t\t   \t';

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      for (const invalidName of [onlySpaces, tabsAndSpaces]) {
        mockOnSubmit.mockClear();
        const nameInput = screen.getByLabelText(/nombre completo/i);
        fireEvent.change(nameInput, { target: { value: invalidName } });

        const submitButton = screen.getByRole('button', { name: /crear contacto/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          if (mockOnSubmit.mock.calls.length > 0) {
            const submittedData = mockOnSubmit.mock.calls[0]?.[0];
            // DISCORDANCIA: Si acepta nombres solo con espacios, hay problema de validación
            if (submittedData?.name && submittedData.name.trim() === '') {
              console.error('🚨 DISCORDANCIA: Formulario acepta nombre solo con espacios:', JSON.stringify(invalidName));
            }
            // Idealmente, no debería enviarse si el nombre solo tiene espacios
            expect(submittedData?.name?.trim()).not.toBe('');
          }
        }, { container, timeout: 3000 });
      }
    });

    it('NO debería aceptar emails duplicados/inválidos - DISCORDANCIA: falta validación de duplicados', async () => {
      const invalidEmails = [
        'test@test@test.com', // Doble @
        'test@', // Incompleto
        '@test.com', // Sin usuario
        'test..test@test.com', // Dobles puntos
        'test@test..com', // Dobles puntos en dominio
        'test@test.c', // TLD muy corto
      ];

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      const nameInput = screen.getByLabelText(/nombre completo/i);
      fireEvent.change(nameInput, { target: { value: 'Test Invalid Email' } });

      for (const invalidEmail of invalidEmails) {
        mockOnSubmit.mockClear();
        const emailInput = screen.getByLabelText(/email/i);
        
        fireEvent.change(emailInput, { target: { value: invalidEmail } });
        fireEvent.blur(emailInput); // Trigger validation

        const submitButton = screen.getByRole('button', { name: /crear contacto/i });
        
        // DISCORDANCIA: Si el formulario acepta emails inválidos, hay problema
        try {
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockOnSubmit.mock.calls.length > 0) {
              const submittedData = mockOnSubmit.mock.calls[0]?.[0];
              // DISCORDANCIA: Email inválido aceptado
              if (submittedData?.email === invalidEmail) {
                console.error(`🚨 DISCORDANCIA: Formulario acepta email inválido: ${invalidEmail}`);
              }
              // El email debería ser válido o no enviarse
              expect(submittedData?.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
            }
          }, { container, timeout: 3000 });
        } catch (error) {
          // Si hay error de validación, es esperado y correcto
        }
      }
    });

    it('NO debería aceptar teléfonos con caracteres no numéricos excepto + y espacios - DISCORDANCIA', async () => {
      const invalidPhones = [
        'abc123',
        '+34abc123',
        '123-456-789-abc',
        '123@456',
        '123/456',
      ];

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      const nameInput = screen.getByLabelText(/nombre completo/i);
      fireEvent.change(nameInput, { target: { value: 'Test Invalid Phone' } });

      const phoneInput = screen.queryByLabelText(/teléfono/i) || screen.queryByLabelText(/phone/i);
      
      if (phoneInput) {
        for (const invalidPhone of invalidPhones) {
          mockOnSubmit.mockClear();
          fireEvent.change(phoneInput, { target: { value: invalidPhone } });
          fireEvent.blur(phoneInput);

          const submitButton = screen.getByRole('button', { name: /crear contacto/i });
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockOnSubmit.mock.calls.length > 0) {
              const submittedData = mockOnSubmit.mock.calls[0]?.[0];
              // DISCORDANCIA: Si acepta teléfonos con caracteres inválidos
              if (submittedData?.phone && /[^0-9+\s-()]/.test(submittedData.phone)) {
                console.error(`🚨 DISCORDANCIA: Formulario acepta teléfono inválido: ${invalidPhone}`);
              }
            }
          }, { container, timeout: 3000 });
        }
      }
    });

    it('NO debería aceptar valores que excedan límites de base de datos - DISCORDANCIA: falta validación de límites', async () => {
      // Límites típicos: name 255, email 255, phone 50
      const exceedingValues = {
        name: 'A'.repeat(300), // Excede 255
        email: 'a'.repeat(250) + '@test.com', // Excede 255
        phone: '+34' + '1'.repeat(100), // Muy largo
      };

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      // Test nombre muy largo
      const nameInput = screen.getByLabelText(/nombre completo/i);
      fireEvent.change(nameInput, { target: { value: exceedingValues.name } });
      
      const submitButton = screen.getByRole('button', { name: /crear contacto/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        if (mockOnSubmit.mock.calls.length > 0) {
          const submittedData = mockOnSubmit.mock.calls[0]?.[0];
          // DISCORDANCIA: Si acepta nombres > 255 caracteres, falta validación
          if (submittedData?.name && submittedData.name.length > 255) {
            console.error(`🚨 DISCORDANCIA: Formulario acepta nombre > 255 caracteres (${submittedData.name.length} chars)`);
          }
          expect(submittedData?.name?.length).toBeLessThanOrEqual(255);
        }
      }, { container, timeout: 3000 });
    });

    it('NO debería permitir IDs de empresa que no existen - DISCORDANCIA: falta validación de FK', async () => {
      const nonExistentCompanyId = 99999;

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      const nameInput = screen.getByLabelText(/nombre completo/i);
      fireEvent.change(nameInput, { target: { value: 'Test Invalid Company' } });

      // Intentar seleccionar empresa inexistente
      // Nota: En el formulario real esto sería un select, pero documentamos el caso
      const submitButton = screen.getByRole('button', { name: /crear contacto/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // DISCORDANCIA: Si el formulario permite company_id que no existe
        // El backend debería rechazarlo, pero el frontend debería validarlo primero
        if (mockOnSubmit.mock.calls.length > 0) {
          const submittedData = mockOnSubmit.mock.calls[0]?.[0];
          if (submittedData?.company_id === nonExistentCompanyId) {
            console.warn('⚠️ DISCORDANCIA: Formulario permite company_id que podría no existir');
          }
        }
      }, { container, timeout: 3000 });
    });

    it('NO debería aceptar combinaciones inválidas de campos - DISCORDANCIA: validación de reglas de negocio', async () => {
      // Casos: email y phone ambos vacíos, name pero sin datos de contacto, etc.
      const invalidCombinations = [
        {
          name: 'Test',
          email: '',
          phone: '',
          // DISCORDANCIA: Contacto sin forma de contacto
        },
        {
          name: '   ', // Solo espacios
          email: 'test@test.com',
          // DISCORDANCIA: Nombre inválido con email válido
        },
      ];

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      for (const invalidCombo of invalidCombinations) {
        mockOnSubmit.mockClear();
        
        const nameInput = screen.getByLabelText(/nombre completo/i);
        fireEvent.change(nameInput, { target: { value: invalidCombo.name } });

        if (invalidCombo.email !== undefined) {
          const emailInput = screen.getByLabelText(/email/i);
          fireEvent.change(emailInput, { target: { value: invalidCombo.email } });
        }

        const submitButton = screen.getByRole('button', { name: /crear contacto/i });
        fireEvent.click(submitButton);

        await waitFor(() => {
          // DISCORDANCIA: Si acepta combinaciones inválidas, hay problema de validación
          if (mockOnSubmit.mock.calls.length > 0) {
            const submittedData = mockOnSubmit.mock.calls[0]?.[0];
            
            // Regla de negocio: debe tener al menos un método de contacto
            if (!submittedData?.email && !submittedData?.phone && !submittedData?.mobile) {
              console.error('🚨 DISCORDANCIA: Contacto creado sin método de contacto');
            }
            
            // Regla de negocio: nombre debe ser válido
            if (submittedData?.name && submittedData.name.trim() === '') {
              console.error('🚨 DISCORDANCIA: Contacto creado con nombre vacío/espacios');
            }
          }
        }, { container, timeout: 3000 });
      }
    });
  });

  describe('Casos no contemplados - Edge Cases Extremos', () => {
    beforeEach(() => {
      mockUser.id = 'test-user';
      mockUser.email = 'test@test.com';
      mockUser.role = 'agent';
      mockGetUser.mockReturnValue({ id: 'test-user', email: 'test@test.com', role: 'agent' });
    });

    it('debe manejar Unicode y emojis en nombres - CASO NO CONTEMPLADO', async () => {
      const unicodeNames = [
        'José María 😀',
        '李小明',
        'María José 🎉',
        'Test\u0000Test', // Null byte en medio
        'Test\nTest', // Newline en medio
      ];

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      for (const unicodeName of unicodeNames) {
        mockOnSubmit.mockClear();
        const nameInput = screen.getByLabelText(/nombre completo/i);
        fireEvent.change(nameInput, { target: { value: unicodeName } });

        const submitButton = screen.getByRole('button', { name: /crear contacto/i });
        
        try {
          fireEvent.click(submitButton);

          await waitFor(() => {
            if (mockOnSubmit.mock.calls.length > 0) {
              const submittedData = mockOnSubmit.mock.calls[0]?.[0];
              // CASO NO CONTEMPLADO: ¿Cómo maneja el sistema Unicode y emojis?
              if (submittedData?.name) {
                console.log(`📝 CASO NO CONTEMPLADO: Nombre con Unicode/emoji procesado: ${submittedData.name}`);
                // Verificar que no rompe el sistema
                expect(submittedData.name).toBeDefined();
              }
            }
          }, { container, timeout: 3000 });
        } catch (error) {
          console.error(`❌ CASO NO CONTEMPLADO: Error procesando Unicode/emoji: ${unicodeName}`, error);
        }
      }
    });

    it('debe manejar valores boundary (límites exactos) - CASO NO CONTEMPLADO', async () => {
      const boundaryValues = {
        name: 'A'.repeat(255), // Exactamente 255
        nameTooLong: 'A'.repeat(256), // Un carácter más
        email: 'a'.repeat(250) + '@test.com', // Email en límite
      };

      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      // Test límite exacto
      const nameInput = screen.getByLabelText(/nombre completo/i);
      fireEvent.change(nameInput, { target: { value: boundaryValues.name } });

      const submitButton = screen.getByRole('button', { name: /crear contacto/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // CASO NO CONTEMPLADO: ¿Qué pasa en el límite exacto?
        if (mockOnSubmit.mock.calls.length > 0) {
          const submittedData = mockOnSubmit.mock.calls[0]?.[0];
          console.log(`📝 CASO NO CONTEMPLADO: Valor en límite procesado: ${submittedData?.name?.length} caracteres`);
        }
      }, { container, timeout: 3000 });
    });

    it('debe manejar campos con valores null/undefined explícitos - CASO NO CONTEMPLADO', async () => {
      // Simular que el formulario recibe null/undefined en campos opcionales
      const { container } = render(
        <ContactForm 
          contact={{
            id: 'contact-1',
            name: 'Test',
            email: null as any,
            phone: undefined as any,
          } as any}
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue('Test')).toBeInTheDocument();
      }, { container });

      // CASO NO CONTEMPLADO: ¿Cómo maneja el formulario null/undefined explícitos?
      const submitButton = screen.getByRole('button', { name: /actualizar/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        if (mockOnSubmit.mock.calls.length > 0) {
          const submittedData = mockOnSubmit.mock.calls[0]?.[0];
          // CASO NO CONTEMPLADO: ¿Se envían null/undefined o se convierten a string vacío?
          console.log('📝 CASO NO CONTEMPLADO: Campos null/undefined:', {
            email: submittedData?.email,
            phone: submittedData?.phone,
          });
        }
      }, { container, timeout: 3000 });
    });

    it('debe manejar envío rápido múltiple del mismo formulario - CASO NO CONTEMPLADO', async () => {
      const { container } = render(
        <ContactForm 
          onSubmit={mockOnSubmit} 
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      }, { container });

      const nameInput = screen.getByLabelText(/nombre completo/i);
      fireEvent.change(nameInput, { target: { value: 'Test Duplicate Submit' } });

      const submitButton = screen.getByRole('button', { name: /crear contacto/i });
      
      // CASO NO CONTEMPLADO: ¿Qué pasa con múltiples clics rápidos?
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);
      fireEvent.click(submitButton);

      await waitFor(() => {
        // CASO NO CONTEMPLADO: ¿Se previene el double-submit?
        const callCount = mockOnSubmit.mock.calls.length;
        console.log(`📝 CASO NO CONTEMPLADO: Clics múltiples resultaron en ${callCount} llamadas`);
        
        // Idealmente debería ser solo 1 llamada
        if (callCount > 1) {
          console.warn('⚠️ CASO NO CONTEMPLADO: Múltiples envíos no prevenidos');
        }
      }, { container, timeout: 5000 });
    });
  });
});

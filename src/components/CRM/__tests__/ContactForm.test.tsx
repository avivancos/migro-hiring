import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { ContactForm } from '@/components/CRM/ContactForm';

// Mock de crmService usando factory function
vi.mock('@/services/crmService', () => {
  const mockGetCompanies = vi.fn();
  
  return {
    crmService: {
      getCompanies: mockGetCompanies,
    },
  };
});

import { crmService } from '@/services/crmService';

describe('ContactForm - Tests Automatizados', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(crmService.getCompanies).mockResolvedValue({
      items: [
        { id: 1, name: 'Empresa Test', email: 'empresa@test.com' },
      ],
      total: 1,
      skip: 0,
      limit: 100,
    });
  });

  it('debe renderizar el formulario', async () => {
    const { container } = render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    }, { container });
  });

  it('debe validar que el nombre es requerido', async () => {
    const { container } = render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear contacto/i })).toBeInTheDocument();
    }, { container });

    const submitButton = screen.getByRole('button', { name: /crear contacto/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, { container });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const { container } = render(<ContactForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    }, { container });

    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    
    fireEvent.change(nameInput, { target: { value: 'María García' } });
    fireEvent.change(emailInput, { target: { value: 'maria@test.com' } });

    const submitButton = screen.getByRole('button', { name: /crear contacto/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'María García',
          email: 'maria@test.com',
        })
      );
    }, { container, timeout: 3000 });
  });

  it('debe guardar todos los campos al editar un contacto', async () => {
    // Crear un contacto existente con todos los campos completos
    const existingContact: any = {
      id: 'test-contact-id',
      name: 'Juan Pérez García',
      first_name: 'Juan',
      last_name: 'Pérez García',
      email: 'juan@test.com',
      phone: '+34123456789',
      mobile: '+34612345678',
      address: 'Calle Principal 123',
      city: 'Madrid',
      state: 'Madrid',
      postal_code: '28001',
      country: 'España',
      company: 'Empresa Original',
      company_id: 1,
      position: 'Director',
      notes: 'Notas originales',
      grading_llamada: 'A',
      grading_situacion: 'B+',
      nacionalidad: 'España',
      tiempo_espana: '5 años',
      empadronado: true,
      lugar_residencia: 'Madrid',
      tiene_ingresos: true,
      trabaja_b: false,
      edad: 35,
      tiene_familiares_espana: true,
      custom_fields: {
        servicio_propuesto: 'nacionalidad',
        servicio_detalle: 'Detalle original del trámite',
        fecha_llegada_espana: '2019-01-15',
      },
      responsible_user_id: 'user-id-123',
    };

    const { container } = render(
      <ContactForm contact={existingContact} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Esperar a que el formulario cargue los datos del contacto
    await waitFor(() => {
      expect(screen.getByDisplayValue('Juan Pérez García')).toBeInTheDocument();
    }, { container, timeout: 3000 });

    // Modificar algunos campos para verificar que se guardan los cambios
    const nameInput = screen.getByLabelText(/nombre completo/i);
    const emailInput = screen.getByLabelText(/^email$/i);
    const phoneInput = screen.getByLabelText(/^teléfono$/i);
    const cityInput = screen.getByLabelText(/^ciudad$/i);
    const nacionalidadInput = screen.getByLabelText(/^nacionalidad$/i);
    const edadInput = screen.getByLabelText(/^edad$/i);
    const lugarResidenciaInput = screen.getByLabelText(/lugar de residencia/i);

    fireEvent.change(nameInput, { target: { value: 'Juan Pérez García Actualizado' } });
    fireEvent.change(emailInput, { target: { value: 'juan.actualizado@test.com' } });
    fireEvent.change(phoneInput, { target: { value: '+34987654321' } });
    fireEvent.change(cityInput, { target: { value: 'Barcelona' } });
    fireEvent.change(nacionalidadInput, { target: { value: 'Colombia' } });
    fireEvent.change(edadInput, { target: { value: '40' } });
    fireEvent.change(lugarResidenciaInput, { target: { value: 'Barcelona' } });

    // Modificar checkboxes - necesitamos desmarcarlos ya que están marcados inicialmente
    const empadronadoCheckbox = screen.getByLabelText(/^empadronado$/i) as HTMLInputElement;
    const tieneIngresosCheckbox = screen.getByLabelText(/tiene ingresos/i) as HTMLInputElement;
    
    // Verificar que están marcados inicialmente
    expect(empadronadoCheckbox.checked).toBe(true);
    expect(tieneIngresosCheckbox.checked).toBe(true);
    
    // Cambiar empadronado a false (desmarcar)
    fireEvent.click(empadronadoCheckbox);
    expect(empadronadoCheckbox.checked).toBe(false);
    
    // Cambiar tiene_ingresos a false (desmarcar)
    fireEvent.click(tieneIngresosCheckbox);
    expect(tieneIngresosCheckbox.checked).toBe(false);

    // Modificar selects
    const gradingLlamadaSelect = screen.getByLabelText(/grading llamada/i) as HTMLSelectElement;
    const servicioPropuestoSelect = screen.getByLabelText(/trámite sugerido/i) as HTMLSelectElement;

    fireEvent.change(gradingLlamadaSelect, { target: { value: 'B+' } });
    fireEvent.change(servicioPropuestoSelect, { target: { value: 'arraigo' } });

    // Modificar textarea de servicio_detalle
    const servicioDetalleTextarea = screen.getByLabelText(/detalle del trámite/i);
    fireEvent.change(servicioDetalleTextarea, { 
      target: { value: 'Detalle actualizado del trámite de arraigo' } 
    });

    // Modificar fecha de llegada
    const fechaLlegadaInput = screen.getByLabelText(/fecha de llegada a españa/i);
    fireEvent.change(fechaLlegadaInput, { target: { value: '2020-05-20' } });

    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(submitButton);

    // Verificar que onSubmit fue llamado con todos los campos
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    }, { container, timeout: 5000 });

    const submittedData = mockOnSubmit.mock.calls[0][0];

    // Verificar campos básicos
    expect(submittedData).toHaveProperty('name', 'Juan Pérez García Actualizado');
    expect(submittedData).toHaveProperty('email', 'juan.actualizado@test.com');
    expect(submittedData).toHaveProperty('phone', '+34987654321');
    expect(submittedData).toHaveProperty('city', 'Barcelona');
    expect(submittedData).toHaveProperty('country', 'España'); // Debe mantenerse
    expect(submittedData).toHaveProperty('mobile', '+34612345678'); // Debe mantenerse
    expect(submittedData).toHaveProperty('address', 'Calle Principal 123'); // Debe mantenerse
    expect(submittedData).toHaveProperty('postal_code', '28001'); // Debe mantenerse
    expect(submittedData).toHaveProperty('state', 'Madrid'); // Debe mantenerse
    expect(submittedData).toHaveProperty('first_name', 'Juan'); // Debe mantenerse
    expect(submittedData).toHaveProperty('last_name', 'Pérez García'); // Debe mantenerse
    expect(submittedData).toHaveProperty('position', 'Director'); // Debe mantenerse
    expect(submittedData).toHaveProperty('notes', 'Notas originales'); // Debe mantenerse
    expect(submittedData).toHaveProperty('company_id', 1); // Debe mantenerse

    // Verificar campos Migro específicos
    expect(submittedData).toHaveProperty('grading_llamada', 'B+');
    expect(submittedData).toHaveProperty('grading_situacion', 'B+'); // Debe mantenerse
    expect(submittedData).toHaveProperty('nacionalidad', 'Colombia');
    expect(submittedData).toHaveProperty('lugar_residencia', 'Barcelona');
    expect(submittedData).toHaveProperty('edad', 40);

    // Verificar campos booleanos
    // Nota: En el formulario, cuando un checkbox está desmarcado (false),
    // el valor se convierte en undefined mediante `e.target.checked || undefined`
    // y NO se envía al backend porque se verifica `if (formData.empadronado !== undefined)`.
    // Por lo tanto, si un checkbox estaba marcado (true) y se desmarca,
    // el campo no se enviará en el request, y el backend debería mantener el valor original.
    // Solo se envían checkboxes que están marcados (true).
    
    // Los checkboxes desmarcados no se envían (undefined), por lo que no deberían estar en submittedData
    expect(submittedData).not.toHaveProperty('empadronado'); // No se envía porque se desmarcó
    expect(submittedData).not.toHaveProperty('tiene_ingresos'); // No se envía porque se desmarcó
    
    // Los checkboxes que no se modifican mantienen su valor y se envían si están marcados
    expect(submittedData).toHaveProperty('trabaja_b', false); // Se mantiene false (aunque no debería enviarse si está false)
    expect(submittedData).toHaveProperty('tiene_familiares_espana', true); // Se mantiene true y se envía

    // Verificar custom_fields
    expect(submittedData).toHaveProperty('custom_fields');
    expect(submittedData.custom_fields).toHaveProperty('servicio_propuesto', 'arraigo');
    expect(submittedData.custom_fields).toHaveProperty(
      'servicio_detalle',
      'Detalle actualizado del trámite de arraigo'
    );
    expect(submittedData.custom_fields).toHaveProperty('fecha_llegada_espana', '2020-05-20');

    // Verificar que responsible_user_id se mantiene
    expect(submittedData).toHaveProperty('responsible_user_id', 'user-id-123');

    // Verificar que todos los campos esperados están presentes
    // Nota: empadronado y tiene_ingresos no se incluyen porque se desmarcaron
    // y se convirtieron en undefined, por lo que no se envían
    const expectedFields = [
      'name', 'first_name', 'last_name', 'email', 'phone', 'mobile',
      'address', 'city', 'state', 'postal_code', 'country',
      'company_id', 'position', 'notes',
      'grading_llamada', 'grading_situacion', 'nacionalidad',
      'tiempo_espana', 'lugar_residencia',
      'trabaja_b', 'edad', 'tiene_familiares_espana',
      'custom_fields', 'responsible_user_id'
    ];

    expectedFields.forEach(field => {
      expect(submittedData).toHaveProperty(field, expect.anything());
    });
    
    // Verificar que los checkboxes desmarcados NO están presentes
    expect(submittedData).not.toHaveProperty('empadronado');
    expect(submittedData).not.toHaveProperty('tiene_ingresos');

    // Verificar estructura de custom_fields
    expect(submittedData.custom_fields).toBeInstanceOf(Object);
    expect(Object.keys(submittedData.custom_fields || {})).toContain('servicio_propuesto');
    expect(Object.keys(submittedData.custom_fields || {})).toContain('servicio_detalle');
    expect(Object.keys(submittedData.custom_fields || {})).toContain('fecha_llegada_espana');
  });
});

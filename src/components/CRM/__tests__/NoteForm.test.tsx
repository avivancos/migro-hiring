import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { NoteForm } from '@/components/CRM/NoteForm';

// Mock de ContactSearchSelect
vi.mock('@/components/CRM/ContactSearchSelect', () => ({
  ContactSearchSelect: ({ value, onChange, label, required }: any) => (
    <div>
      <label htmlFor="contact-select">{label}</label>
      <select
        id="contact-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Seleccionar contacto...</option>
        <option value="contact-1">Contacto 1</option>
        <option value="contact-2">Contacto 2</option>
      </select>
    </div>
  ),
}));

describe('NoteForm - Tests Automatizados', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar el formulario', async () => {
    const { container } = render(
      <NoteForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
        defaultEntityType="contacts"
        defaultEntityId="contact-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/contenido/i)).toBeInTheDocument();
    }, { container });
  });

  it('debe validar que el contenido es requerido', async () => {
    const { container } = render(
      <NoteForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
        defaultEntityType="contacts"
        defaultEntityId="contact-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /crear nota/i })).toBeInTheDocument();
    }, { container });

    const submitButton = screen.getByRole('button', { name: /crear nota/i });
    fireEvent.click(submitButton);

    // El formulario muestra alert si el contenido está vacío, verificamos que onSubmit no fue llamado
    await waitFor(() => {
      expect(mockOnSubmit).not.toHaveBeenCalled();
    }, { container, timeout: 2000 });
  });

  it('debe enviar el formulario con datos válidos', async () => {
    const { container } = render(
      <NoteForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
        defaultEntityType="contacts"
        defaultEntityId="contact-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/contenido/i)).toBeInTheDocument();
    }, { container });

    const contentTextarea = screen.getByLabelText(/contenido/i);
    const noteTypeSelect = screen.getByLabelText(/tipo de nota/i);

    fireEvent.change(contentTextarea, { target: { value: 'Nota de prueba completa' } });
    fireEvent.change(noteTypeSelect, { target: { value: 'comment' } });

    const submitButton = screen.getByRole('button', { name: /crear nota/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Nota de prueba completa',
          note_type: 'comment',
          entity_type: 'contacts',
          entity_id: 'contact-1',
        })
      );
    }, { container, timeout: 3000 });
  });

  it('debe guardar todos los campos al editar una nota', async () => {
    const existingNote: any = {
      id: 'note-1',
      content: 'Contenido original de la nota',
      note_type: 'comment',
      entity_type: 'contacts',
      entity_id: 'contact-1',
    };

    const { container } = render(
      <NoteForm 
        note={existingNote}
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Contenido original de la nota')).toBeInTheDocument();
    }, { container, timeout: 3000 });

    // Modificar el contenido
    const contentTextarea = screen.getByLabelText(/contenido/i);
    fireEvent.change(contentTextarea, { target: { value: 'Contenido actualizado de la nota' } });

    // Modificar el tipo de nota
    const noteTypeSelect = screen.getByLabelText(/tipo de nota/i);
    fireEvent.change(noteTypeSelect, { target: { value: 'call' } });

    // Enviar formulario
    const submitButton = screen.getByRole('button', { name: /actualizar/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Contenido actualizado de la nota',
          note_type: 'call',
          entity_type: 'contacts',
          entity_id: 'contact-1',
        })
      );
    }, { container, timeout: 3000 });

    // Verificar que todos los campos esperados están presentes
    const submittedData = mockOnSubmit.mock.calls[0][0];
    expect(submittedData).toHaveProperty('content');
    expect(submittedData).toHaveProperty('note_type');
    expect(submittedData).toHaveProperty('entity_type');
    expect(submittedData).toHaveProperty('entity_id');
  });
});

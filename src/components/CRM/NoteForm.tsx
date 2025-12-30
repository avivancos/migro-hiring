// NoteForm - Formulario para crear/editar notas
// Optimizado con React.memo para evitar re-renders innecesarios

import { useState, memo } from 'react';
import type { FormEvent } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ContactSearchSelect } from './ContactSearchSelect';
import type { Note } from '@/types/crm';

interface NoteFormProps {
  note?: Note;
  defaultEntityType?: 'contacts';
  defaultEntityId?: string;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const NoteForm = memo(function NoteForm({
  note,
  defaultEntityType,
  defaultEntityId,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    content: note?.content || '',
    note_type: note?.note_type || 'comment', // El backend espera "comment" por defecto
    entity_type: note?.entity_type || defaultEntityType || 'contacts',
    entity_id: note?.entity_id || defaultEntityId || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validar que el contenido no esté vacío
    if (!formData.content || formData.content.trim().length === 0) {
      alert('El contenido de la nota no puede estar vacío');
      return;
    }

    setLoading(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting form:', err);
      // El error ya se maneja en el componente padre
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {note ? 'Editar Nota' : 'Nueva Nota'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contenido */}
          <div>
            <Label htmlFor="content">
              Contenido <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Escribe tu nota aquí..."
              rows={6}
              required
            />
          </div>

          {/* Tipo de nota */}
          <div>
            <Label htmlFor="note_type">Tipo de Nota</Label>
            <select
              id="note_type"
              value={formData.note_type}
              onChange={(e) => handleChange('note_type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="comment">Comentario</option>
              <option value="call">Llamada</option>
              <option value="meeting">Reunión</option>
              <option value="email">Email</option>
              <option value="task">Tarea</option>
            </select>
          </div>

          {/* Entity Type (oculto si viene por default) */}
          {!defaultEntityType && (
            <div>
              <Label htmlFor="entity_type">
                Relacionado con <span className="text-red-500">*</span>
              </Label>
              <select
                id="entity_type"
                value={formData.entity_type}
                onChange={(e) => handleChange('entity_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="contacts">Contacto</option>
              </select>
            </div>
          )}

          {/* Entity ID (oculto si viene por default) */}
          {!defaultEntityId && formData.entity_type === 'contacts' && (
            <div>
              <ContactSearchSelect
                value={formData.entity_id}
                onChange={(contactId) => handleChange('entity_id', contactId)}
                label="Contacto"
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700"
              disabled={loading}
            >
              {loading ? 'Guardando...' : note ? 'Actualizar' : 'Crear Nota'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada: solo re-renderizar si cambian props relevantes
  return (
    prevProps.note?.id === nextProps.note?.id &&
    prevProps.defaultEntityType === nextProps.defaultEntityType &&
    prevProps.defaultEntityId === nextProps.defaultEntityId
  );
});



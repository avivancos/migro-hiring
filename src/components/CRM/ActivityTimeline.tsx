// ActivityTimeline - Timeline of notes and activities for leads/contacts

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Note } from '@/types/crm';
import { crmService } from '@/services/crmService';
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Settings,
  Plus,
} from 'lucide-react';

interface ActivityTimelineProps {
  entityType: 'lead' | 'contact' | 'company';
  entityId: string;
}

export function ActivityTimeline({ entityType, entityId }: ActivityTimelineProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [entityType, entityId]);

  const loadNotes = async () => {
    setLoading(true);
    try {
      // Si entity_id es "new", esperar lista vacía sin errores
      if (entityId === 'new') {
        setNotes([]);
        setLoading(false);
        return;
      }
      
      const notesData = await crmService.getNotes({ 
        entity_type: entityType === 'lead' ? 'leads' : entityType === 'contact' ? 'contacts' : entityType,
        entity_id: entityId, 
        limit: 50 
      });
      setNotes(notesData.items || []);
    } catch (err) {
      console.error('Error loading notes:', err);
      setNotes([]); // Mostrar lista vacía en caso de error
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    setAdding(true);
    try {
      await crmService.createNote({
        entity_type: entityType,
        entity_id: entityId,
        note_type: 'comment',
        content: newNote,
      });
      setNewNote('');
      await loadNotes();
    } catch (err) {
      console.error('Error adding note:', err);
    } finally {
      setAdding(false);
    }
  };

  const getNoteIcon = (noteType: string) => {
    switch (noteType) {
      case 'call_in':
      case 'call_out':
        return Phone;
      case 'email':
        return Mail;
      case 'meeting':
        return Calendar;
      case 'system':
        return Settings;
      default:
        return MessageSquare;
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-sm">Cargando actividades...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Timeline de Actividades</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setNewNote(prev => prev === '' ? ' ' : '')}
          >
            <Plus size={16} className="mr-1" />
            Nueva Nota
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Add Note Form */}
        <div className="mb-6">
          <textarea
            className="w-full rounded-md border border-gray-300 p-3 text-sm"
            rows={3}
            placeholder="Agregar una nota o comentario..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
          />
          {newNote.trim() && (
            <div className="flex justify-end mt-2">
              <Button
                size="sm"
                onClick={handleAddNote}
                disabled={adding}
                className="bg-green-600 hover:bg-green-700"
              >
                {adding ? 'Guardando...' : 'Guardar Nota'}
              </Button>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay actividades registradas
            </p>
          ) : (
            notes.map((note, index) => {
              const Icon = getNoteIcon(note.note_type);
              
              return (
                <div key={note.id} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                      <Icon size={16} />
                    </div>
                    {index < notes.length - 1 && (
                      <div className="w-0.5 flex-1 bg-gray-200 my-1"></div>
                    )}
                  </div>

                  {/* Note Content */}
                  <div className="flex-1 pb-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {note.note_type === 'call_in' && 'Llamada Entrante'}
                          {note.note_type === 'call_out' && 'Llamada Saliente'}
                          {note.note_type === 'email' && 'Email'}
                          {note.note_type === 'meeting' && 'Reunión'}
                          {note.note_type === 'system' && 'Sistema'}
                          {note.note_type === 'comment' && 'Comentario'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDateTime(note.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {note.content}
                      </p>
                      {note.params && Object.keys(note.params).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
                          {note.params.duration && (
                            <div>Duración: {note.params.duration}s</div>
                          )}
                          {note.params.phone && (
                            <div>Teléfono: {note.params.phone}</div>
                          )}
                          {note.params.recording_url && (
                            <a
                              href={note.params.recording_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Ver grabación
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}


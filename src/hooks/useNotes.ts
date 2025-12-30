// Hook personalizado para gestionar notas CRM
// Mobile-first con paginación y filtros

import { useState, useEffect, useCallback } from 'react';
import { crmService } from '@/services/crmService';
import type { Note, NoteCreateRequest, NoteUpdateRequest } from '@/types/crm';
import { useAuth } from './useAuth';

interface UseNotesOptions {
  skip?: number;
  limit?: number;
  entityId?: string;
  entityType?: 'contacts';
  autoLoad?: boolean;
}

export function useNotes(options: UseNotesOptions = {}) {
  const { skip = 0, limit = 50, entityId, entityType, autoLoad = true } = options;
  const { user } = useAuth();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: any = {
        skip,
        limit,
      };

      if (entityId) {
        filters.entity_id = entityId;
      }

      if (entityType) {
        filters.entity_type = entityType;
      }

      // ⚠️ IMPORTANTE: Actualmente el backend NO filtra por usuario
      // Los usuarios regulares deberían ver solo sus notas, pero esto debe implementarse en el backend
      // Por ahora, el frontend puede filtrar como medida temporal
      // TODO: Implementar filtrado por created_by en el backend

      const response = await crmService.getNotes(filters);
      
      const notesList = response.items || [];
      
      // ⚠️ Filtrado temporal en el cliente (hasta que el backend lo implemente)
      const isAdmin = user?.role === 'admin' || user?.is_superuser;
      let filteredNotes = notesList;
      
      if (!isAdmin && user?.id) {
        // Filtrar solo notas del usuario actual
        filteredNotes = notesList.filter(note => 
          note.created_by === user.id
        );
      }

      setNotes(filteredNotes);
      setTotal(response.total || filteredNotes.length);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar notas'));
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  }, [skip, limit, entityId, entityType, user]);

  const createNote = useCallback(async (noteData: NoteCreateRequest): Promise<Note> => {
    try {
      // ⚠️ IMPORTANTE: Auto-asignar created_by si no viene
      // Actualmente el backend NO lo hace automáticamente, así que lo hacemos en el frontend
      if (!noteData.created_by && user?.id) {
        noteData.created_by = user.id;
      }

      const newNote = await crmService.createNote(noteData);
      setNotes(prev => [newNote, ...prev]);
      setTotal(prev => prev + 1);
      return newNote;
    } catch (err) {
      console.error('Error creating note:', err);
      throw err;
    }
  }, [user]);

  const updateNote = useCallback(async (noteId: string, updates: NoteUpdateRequest): Promise<Note> => {
    try {
      const updatedNote = await crmService.updateNote(noteId, updates);
      setNotes(prev =>
        prev.map(note => (note.id === noteId ? updatedNote : note))
      );
      return updatedNote;
    } catch (err) {
      console.error('Error updating note:', err);
      throw err;
    }
  }, []);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    try {
      await crmService.deleteNote(noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
      setTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting note:', err);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    if (autoLoad) {
      fetchNotes();
    }
  }, [autoLoad, fetchNotes]);

  return {
    notes,
    loading,
    error,
    total,
    refresh,
    createNote,
    updateNote,
    deleteNote,
  };
}

// Hook específico para notas de un contacto
export function useContactNotes(contactId: string, options: Omit<UseNotesOptions, 'entityId' | 'entityType'> = {}) {
  return useNotes({
    ...options,
    entityId: contactId,
    entityType: 'contacts',
  });
}


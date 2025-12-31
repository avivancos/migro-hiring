// Hook personalizado para gestionar notas CRM
// Mobile-first con paginación y filtros

import { useState, useEffect, useCallback } from 'react';
import { crmService } from '@/services/crmService';
import type { Note, NoteCreateRequest, NoteUpdateRequest, CRMUser } from '@/types/crm';
import { useAuth } from './useAuth';

interface UseNotesOptions {
  skip?: number;
  limit?: number;
  entityId?: string;
  entityType?: 'contacts';
  createdBy?: string; // UUID del creador - Solo para admins
  autoLoad?: boolean;
}

export function useNotes(options: UseNotesOptions = {}) {
  const { skip = 0, limit = 50, entityId, entityType, createdBy, autoLoad = true } = options;
  const { user } = useAuth();
  
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);
  const [crmUsers, setCrmUsers] = useState<CRMUser[]>([]);

  // Cargar usuarios CRM una vez al montar el componente
  useEffect(() => {
    const loadCRMUsers = async () => {
      try {
        const users = await crmService.getUsers(true);
        setCrmUsers(users);
      } catch (err) {
        console.warn('⚠️ [useNotes] Error cargando usuarios CRM:', err);
        setCrmUsers([]);
      }
    };
    loadCRMUsers();
  }, []);

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

      const isAdmin = user?.role === 'admin' || user?.is_superuser;
      
      // Para usuarios regulares: buscar el usuario CRM correspondiente y establecer created_by
      if (!isAdmin) {
        // Si hay un filtro de created_by explícito, eliminarlo (solo admins pueden usarlo)
        if (createdBy) {
          // No hacer nada, el filtro no se aplicará
        }
        
        // Buscar el usuario CRM correspondiente al usuario del sistema usando el email
        if (user?.email && crmUsers.length > 0) {
          const crmUser = crmUsers.find(u => u.email === user.email);
          if (crmUser) {
            filters.created_by = crmUser.id;
            console.log('🔍 [useNotes] Usuario regular, filtrando por CRM user:', {
              systemUserId: user.id,
              systemUserEmail: user.email,
              crmUserId: crmUser.id,
              crmUserName: crmUser.name,
            });
          } else {
            console.warn('⚠️ [useNotes] No se encontró usuario CRM para:', user.email);
          }
        } else if (user?.email && crmUsers.length === 0) {
          // Si aún no se han cargado los usuarios CRM, intentar cargarlos ahora
          try {
            const users = await crmService.getUsers(true);
            setCrmUsers(users);
            const crmUser = users.find(u => u.email === user.email);
            if (crmUser) {
              filters.created_by = crmUser.id;
              console.log('🔍 [useNotes] Usuario CRM encontrado después de carga:', {
                crmUserId: crmUser.id,
                crmUserName: crmUser.name,
              });
            }
          } catch (err) {
            console.warn('⚠️ [useNotes] Error cargando usuarios CRM:', err);
          }
        }
      } else if (isAdmin && createdBy) {
        // Para admins: permitir filtrar por created_by si se especifica
        filters.created_by = createdBy;
      }

      // Debug: Log de filtros
      if (isAdmin) {
        console.log('🔍 [useNotes] Admin filtrando notas:', {
          created_by: filters.created_by,
          filters: filters,
        });
      }

      const response = await crmService.getNotes(filters);
      
      const notesList = response.items || [];
      
      // ⚠️ Filtrado adicional de seguridad en el cliente (medida de seguridad)
      // Verificar que los usuarios regulares solo ven sus propias notas
      let filteredNotes = notesList;
      
      if (!isAdmin && user?.email) {
        // Buscar el usuario CRM para comparar correctamente
        const crmUser = crmUsers.find(u => u.email === user.email) || 
                       (crmUsers.length === 0 ? null : null);
        
        if (crmUser) {
          // Filtrar solo notas del usuario CRM actual (medida de seguridad adicional)
          filteredNotes = notesList.filter(note => 
            note.created_by === crmUser.id
          );
        } else if (filters.created_by) {
          // Si ya se filtró por created_by en el backend, usar ese filtro
          filteredNotes = notesList.filter(note => 
            note.created_by === filters.created_by
          );
        }
      }

      setNotes(filteredNotes);
      setTotal(response.total || filteredNotes.length);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al cargar notas'));
      console.error('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  }, [skip, limit, entityId, entityType, createdBy, user, crmUsers]);

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


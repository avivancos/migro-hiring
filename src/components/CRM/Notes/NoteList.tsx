// NoteList - Lista de notas con paginación
// Mobile-first

import { useState } from 'react';
import { useNotes } from '@/hooks/useNotes';
import NoteCard from './NoteCard';
import NoteFilters from './NoteFilters';
import type { Note } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface NoteFiltersState {
  created_by?: string;
  note_type?: string;
}

interface NoteListProps {
  entityId?: string;
  entityType?: 'contacts';
  showActions?: boolean;
  showFilters?: boolean;
  onNotePress?: (note: Note) => void;
  onNoteEdit?: (note: Note) => void;
  onNoteDelete?: (noteId: string) => void;
}

export default function NoteList({ 
  entityId,
  entityType,
  showActions = true,
  showFilters = true,
  onNotePress,
  onNoteEdit,
  onNoteDelete,
}: NoteListProps) {
  const [filters, setFilters] = useState<NoteFiltersState>({});
  
  const { notes, loading, error, refresh } = useNotes({
    entityId,
    entityType,
    createdBy: filters.created_by,
    autoLoad: true,
    limit: 50,
  });

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 mb-4">Error: {error.message}</p>
        <Button onClick={refresh}>Reintentar</Button>
      </div>
    );
  }

  // Filtrar por tipo de nota si está especificado
  const filteredNotes = filters.note_type
    ? notes.filter(note => note.note_type === filters.note_type)
    : notes;

  return (
    <div className="space-y-4">
      {showFilters && (
        <NoteFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
        />
      )}

      <div className="space-y-3">
        {filteredNotes.length === 0 && !loading ? (
          <div className="p-8 text-center text-gray-500">
            <p>No hay notas que mostrar</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <NoteCard
              key={note.id}
              note={note}
              onPress={() => onNotePress?.(note)}
              onEdit={onNoteEdit}
              onDelete={onNoteDelete}
              showActions={showActions}
            />
          ))
        )}

        {loading && (
          <div className="flex justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}


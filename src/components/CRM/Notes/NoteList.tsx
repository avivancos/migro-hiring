// NoteList - Lista de notas con paginación
// Mobile-first

import { useNotes } from '@/hooks/useNotes';
import NoteCard from './NoteCard';
import type { Note } from '@/types/crm';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface NoteListProps {
  entityId?: string;
  entityType?: 'contacts';
  showActions?: boolean;
  onNotePress?: (note: Note) => void;
  onNoteEdit?: (note: Note) => void;
  onNoteDelete?: (noteId: string) => void;
}

export default function NoteList({ 
  entityId,
  entityType,
  showActions = true,
  onNotePress,
  onNoteEdit,
  onNoteDelete,
}: NoteListProps) {
  const { notes, loading, error, refresh } = useNotes({
    entityId,
    entityType,
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

  return (
    <div className="space-y-3">
      {notes.length === 0 && !loading ? (
        <div className="p-8 text-center text-gray-500">
          <p>No hay notas que mostrar</p>
        </div>
      ) : (
        notes.map(note => (
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
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      )}
    </div>
  );
}


// CRM Notes - Página principal de notas
// Mobile-first con diseño moderno

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';
import NoteList from '@/components/CRM/Notes/NoteList';
import { NoteForm } from '@/components/CRM/NoteForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { NoteCreateRequest } from '@/types/crm';

export function CRMNotes() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const { notes, refresh, createNote, deleteNote } = useNotes({
    autoLoad: true,
    limit: 50,
  });

  const handleCreateNote = async (noteData: NoteCreateRequest) => {
    try {
      await createNote(noteData);
      setShowForm(false);
      refresh();
    } catch (err) {
      console.error('Error creating note:', err);
      alert('Error al crear la nota');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      refresh();
    } catch (err) {
      console.error('Error deleting note:', err);
      alert('Error al eliminar la nota');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 md:py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/crm')}
              variant="ghost"
              size="icon"
              className="md:hidden"
            >
              <ArrowLeftIcon width={20} height={20} />
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notas</h1>
              <p className="text-gray-600 mt-1">
                {notes.length} {notes.length === 1 ? 'nota' : 'notas'}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 flex items-center gap-2 w-full md:w-auto"
          >
            <PlusIcon width={18} height={18} />
            Nueva Nota
          </Button>
        </div>

        {/* Formulario de creación */}
        {showForm && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <NoteForm
                onSubmit={handleCreateNote}
                onCancel={() => setShowForm(false)}
              />
            </CardContent>
          </Card>
        )}

        {/* Lista de notas */}
        <NoteList
          showActions={true}
          onNoteDelete={handleDeleteNote}
        />
      </div>
    </div>
  );
}


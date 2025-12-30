// NoteCard - Card individual de nota
// Mobile-first con enlaces a contactos y navegación

import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Note } from '@/types/crm';
import { formatDateTime } from '@/utils/formatters';
import {
  MessageSquare,
  Phone,
  Mail,
  Settings,
  User,
  ChevronRight,
  Eye,
  Trash2,
  Edit,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface NoteCardProps {
  note: Note;
  onEdit?: (note: Note) => void;
  onDelete?: (noteId: string) => void;
  onPress?: () => void;
  showActions?: boolean;
}

export default function NoteCard({ 
  note, 
  onEdit,
  onDelete,
  onPress,
  showActions = true 
}: NoteCardProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.is_superuser;
  const canEdit = isAdmin || note.created_by === user?.id;

  const getNoteTypeIcon = (type?: string | null) => {
    switch (type) {
      case 'call':
        return Phone;
      case 'email':
        return Mail;
      case 'system':
        return Settings;
      default:
        return MessageSquare;
    }
  };

  const getNoteTypeLabel = (type?: string | null) => {
    const labels: Record<string, string> = {
      comment: 'Comentario',
      call: 'Llamada',
      email: 'Email',
      system: 'Sistema',
      other: 'Otro',
    };
    return labels[type || 'comment'] || 'Nota';
  };

  const Icon = getNoteTypeIcon(note.note_type);
  const contactId = note.entity_type === 'contacts' ? note.entity_id : null;

  return (
    <Card 
      className="note-card-mobile"
      onClick={onPress}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && onPress?.()}
    >
      <CardContent className="pt-4">
        {/* Header con tipo y fecha */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gray-100">
              <Icon size={18} className="text-gray-600" />
            </div>
            <span className="text-sm font-medium text-gray-900">
              {getNoteTypeLabel(note.note_type)}
            </span>
          </div>
          <time className="text-xs text-gray-500">
            {formatDateTime(note.created_at)}
          </time>
        </div>

        {/* Contenido */}
        <div className="mb-3">
          <p className="text-gray-900 whitespace-pre-wrap">{note.content}</p>
        </div>

        {/* ✅ ENLACE A CONTACTO */}
        {contactId && (
          <Link 
            to={`/crm/contacts/${contactId}`}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <User size={16} className="text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Ver contacto</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </Link>
        )}

        {/* Acciones */}
        {showActions && (
          <div className="flex gap-2 pt-3 border-t">
            <Link 
              to={`/crm/notes/${note.id}`}
              className="flex-1"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                size="sm"
                variant="outline"
                className="w-full"
              >
                <Eye size={16} className="mr-1" />
                Detalles
              </Button>
            </Link>
            {canEdit && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(note);
                }}
              >
                <Edit size={16} />
              </Button>
            )}
            {canEdit && onDelete && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('¿Estás seguro de eliminar esta nota?')) {
                    onDelete(note.id);
                  }
                }}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


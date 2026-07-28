import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api/client';
import TastingNoteCard from './TastingNoteCard';
import TastingNoteForm from './TastingNoteForm';
import type { CreateNoteData } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TastingNotesListProps {
  brewId: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TastingNotesList({ brewId }: TastingNotesListProps) {
  const queryClient = useQueryClient();

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const {
    data: notes,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['brew', brewId, 'notes'],
    queryFn: () => notesApi.listByBrew(brewId),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateNoteData) => notesApi.create(brewId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brew', brewId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brew', brewId] });
      setDeletingId(null);
    },
  });

  const handleDelete = (id: number) => {
    setDeletingId(id);
    deleteMutation.mutate(id);
  };

  if (error) {
    return <div className="state-error">Error al cargar las notas de cata.</div>;
  }

  return (
    <section className="notes-section">
      <h3>Notas de cata</h3>

      {/* Existing notes */}
      {isLoading ? (
        <div className="state-msg">Cargando notas…</div>
      ) : !notes || notes.length === 0 ? (
        <p className="empty-note">Todavía no hay notas de cata.</p>
      ) : (
        <div className="note-cards">
          {notes.map((note) => (
            <TastingNoteCard
              key={note.id}
              note={note}
              onDelete={handleDelete}
              isDeleting={deletingId === note.id && deleteMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Add note form */}
      <div className="note-form-wrapper">
        {deleteMutation.isError && (
          <div className="state-error">
            Error al eliminar la nota: {(deleteMutation.error as Error).message}
          </div>
        )}
        {createMutation.isError && (
          <div className="state-error">
            Error al agregar la nota: {(createMutation.error as Error).message}
          </div>
        )}

        <TastingNoteForm
          onSubmit={(data) => createMutation.mutate(data)}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </section>
  );
}

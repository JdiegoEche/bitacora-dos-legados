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
  const [editingId, setEditingId] = useState<number | null>(null);

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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateNoteData> }) =>
      notesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brew', brewId] });
      setEditingId(null);
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
          {notes.map((note) =>
            editingId === note.id ? (
              <div key={note.id} className="note-form-wrapper">
                {updateMutation.isError && (
                  <div className="state-error">
                    Error al guardar los cambios: {(updateMutation.error as Error).message}
                  </div>
                )}
                <TastingNoteForm
                  initialData={note}
                  onSubmit={(data) => updateMutation.mutate({ id: note.id, data })}
                  onCancel={() => setEditingId(null)}
                  isSubmitting={updateMutation.isPending}
                />
              </div>
            ) : (
              <TastingNoteCard
                key={note.id}
                note={note}
                onEdit={setEditingId}
                onDelete={handleDelete}
                isDeleting={deletingId === note.id && deleteMutation.isPending}
              />
            ),
          )}
        </div>
      )}

      {deleteMutation.isError && (
        <div className="state-error">
          Error al eliminar la nota: {(deleteMutation.error as Error).message}
        </div>
      )}

      {/* Add note form — a brew only gets one tasting note; hidden once it exists,
          reappears automatically if that note is deleted (notes.length back to 0) */}
      {!isLoading && (!notes || notes.length === 0) && (
        <div className="note-form-wrapper">
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
      )}
    </section>
  );
}

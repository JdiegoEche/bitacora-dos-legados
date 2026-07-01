import type { TastingNote } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

function ratingLabel(n: number | null): string {
  if (n == null) return '';
  return `Rating: ${n}/5`;
}

// ─── Component ──────────────────────────────────────────────────────────────

interface TastingNoteCardProps {
  note: TastingNote;
  onDelete: (id: number) => void;
  isDeleting?: boolean;
}

export default function TastingNoteCard({
  note,
  onDelete,
  isDeleting,
}: TastingNoteCardProps) {
  return (
    <div className="note-card">
      <div className="note-attributes">
        {note.aroma && (
          <span>
            <strong>Aroma:</strong> {note.aroma}
          </span>
        )}
        {note.flavor && (
          <span>
            <strong>Flavor:</strong> {note.flavor}
          </span>
        )}
        {note.body && (
          <span>
            <strong>Body:</strong> {note.body}
          </span>
        )}
        {note.acidity && (
          <span>
            <strong>Acidity:</strong> {note.acidity}
          </span>
        )}
      </div>

      {note.freeText && <p className="note-text">{note.freeText}</p>}

      <div className="note-footer">
        <span className="note-rating">{ratingLabel(note.rating)}</span>
        <button
          onClick={() => onDelete(note.id)}
          className="btn btn-small btn-danger"
          disabled={isDeleting}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

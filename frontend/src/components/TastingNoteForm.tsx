import { useState } from 'react';
import type { TastingNote } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

type NoteFields = Pick<
  TastingNote,
  'aroma' | 'flavor' | 'body' | 'acidity' | 'rating' | 'freeText'
>;

interface TastingNoteFormProps {
  onSubmit: (data: NoteFields) => void;
  isSubmitting?: boolean;
  /** When set, the form operates in edit mode and pre-fills these values. */
  initialData?: NoteFields;
  /** Shown only in edit mode, to exit without saving. */
  onCancel?: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TastingNoteForm({
  onSubmit,
  isSubmitting,
  initialData,
  onCancel,
}: TastingNoteFormProps) {
  const isEdit = initialData != null;

  const [aroma, setAroma] = useState(initialData?.aroma ?? '');
  const [flavor, setFlavor] = useState(initialData?.flavor ?? '');
  const [body, setBody] = useState(initialData?.body ?? '');
  const [acidity, setAcidity] = useState(initialData?.acidity ?? '');
  const [rating, setRating] = useState(
    initialData?.rating ? String(initialData.rating) : '',
  );
  const [freeText, setFreeText] = useState(initialData?.freeText ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSubmit({
      aroma: aroma.trim() || null,
      flavor: flavor.trim() || null,
      body: body.trim() || null,
      acidity: acidity.trim() || null,
      rating: rating ? Number(rating) : null,
      freeText: freeText.trim() || null,
    });

    if (!isEdit) {
      // Reset form after submit — only in "add" mode, where the form stays open
      setAroma('');
      setFlavor('');
      setBody('');
      setAcidity('');
      setRating('');
      setFreeText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="note-form">
      <div className="note-form-row">
        <label className="field">
          Aroma
          <input
            value={aroma}
            onChange={(e) => setAroma(e.target.value)}
            placeholder="floral, a nuez…"
            className="input"
          />
        </label>
        <label className="field">
          Sabor
          <input
            value={flavor}
            onChange={(e) => setFlavor(e.target.value)}
            placeholder="frutos rojos, chocolate…"
            className="input"
          />
        </label>
      </div>

      <div className="note-form-row">
        <label className="field">
          Cuerpo
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="liviano, con cuerpo…"
            className="input"
          />
        </label>
        <label className="field">
          Acidez
          <input
            value={acidity}
            onChange={(e) => setAcidity(e.target.value)}
            placeholder="brillante, vibrante…"
            className="input"
          />
        </label>
      </div>

      <label className="field">
        Calificación (1–5)
        <select
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="input note-rating-select"
        >
          <option value="">—</option>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        Notas
        <textarea
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          rows={2}
          className="input"
          placeholder="Comentarios adicionales…"
        />
      </label>

      <div className="note-form-actions">
        <button type="submit" disabled={isSubmitting} className="btn">
          {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Agregar nota'}
        </button>
        {isEdit && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

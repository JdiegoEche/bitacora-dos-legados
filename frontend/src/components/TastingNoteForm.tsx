import { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TastingNoteFormProps {
  onSubmit: (data: {
    aroma: string | null;
    flavor: string | null;
    body: string | null;
    acidity: string | null;
    rating: number | null;
    freeText: string | null;
  }) => void;
  isSubmitting?: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TastingNoteForm({
  onSubmit,
  isSubmitting,
}: TastingNoteFormProps) {
  const [aroma, setAroma] = useState('');
  const [flavor, setFlavor] = useState('');
  const [body, setBody] = useState('');
  const [acidity, setAcidity] = useState('');
  const [rating, setRating] = useState('');
  const [freeText, setFreeText] = useState('');

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

    // Reset form after submit
    setAroma('');
    setFlavor('');
    setBody('');
    setAcidity('');
    setRating('');
    setFreeText('');
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

      <button type="submit" disabled={isSubmitting} className="btn">
        {isSubmitting ? 'Guardando…' : 'Agregar nota'}
      </button>
    </form>
  );
}

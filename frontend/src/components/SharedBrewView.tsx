import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { brewsApi } from '../api/client';
import TastingNotesList from './TastingNotesList';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function stars(n: number | null): string {
  if (n == null) return '—';
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SharedBrewView() {
  const { shareToken } = useParams<{ shareToken: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-brew', shareToken],
    queryFn: () => brewsApi.getPublic(shareToken!),
    enabled: !!shareToken,
  });

  if (isLoading) return <div className="state-msg">Cargando preparación…</div>;

  if (error || !data) {
    return (
      <div className="state-error">
        <p>Preparación no encontrada o no compartida.</p>
        <Link to="/">Volver al inicio</Link>
      </div>
    );
  }

  const brew = data.brew;

  return (
    <div className="shared-brew-page">
      <header className="shared-brew-header">
        <Link to="/" className="btn btn-secondary">← Volver</Link>
        <p className="shared-brew-badge">Preparación compartida</p>
      </header>

      <div className="shared-brew-card">
        <h2>{brew.method}</h2>

        <div className="detail-grid">
          <Field label="Fecha" value={formatDate(brew.createdAt)} />
          <Field label="Método" value={brew.method} />
          <Field label="Molienda" value={brew.grindSize || '—'} />
          <Field label="Temp. agua" value={brew.waterTemp ? `${brew.waterTemp}°C` : '—'} />
          <Field label="Tiempo" value={brew.brewTime ? `${brew.brewTime}s` : '—'} />
          <Field label="Café" value={brew.coffeeDose ? `${brew.coffeeDose}g` : '—'} />
          <Field label="Agua" value={brew.waterDose ? `${brew.waterDose}g` : '—'} />
          <Field label="Calificación" value={stars(brew.rating ? Number(brew.rating) : null)} />

          {brew.coffeeBean && (
            <Field
              label="Café"
              value={`${brew.coffeeBean.name} (${brew.coffeeBean.roaster})${brew.coffeeBean.roastLevel ? ` — ${brew.coffeeBean.roastLevel}` : ''}`}
            />
          )}
        </div>

        {brew.notes && (
          <div className="detail-notes">
            <h3>Notas</h3>
            <p>{brew.notes}</p>
          </div>
        )}

        <TastingNotesList brewId={brew.id} />
      </div>
    </div>
  );
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { brewsApi } from '../api/client';
import TastingNotesList from './TastingNotesList';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function stars(n: number | null): string {
  if (n == null) return '—';
  return '★'.repeat(n) + '☆'.repeat(5 - n);
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BrewDetail() {
  const { id } = useParams<{ id: string }>();
  const brewId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: brew,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['brew', brewId],
    queryFn: () => brewsApi.getById(brewId),
    enabled: !Number.isNaN(brewId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => brewsApi.delete(brewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brews'] });
      navigate('/bitacora');
    },
  });

  if (Number.isNaN(brewId)) {
    return <div className="state-error">Invalid brew ID.</div>;
  }

  if (isLoading) return <div className="state-msg">Loading…</div>;

  if (error || !brew) {
    return (
      <div className="state-error">
        Brew session not found.{' '}
        <Link to="/bitacora">Back to list</Link>
      </div>
    );
  }

  return (
    <div>
      <div className="detail-header">
        <h2>{brew.method} Brew</h2>
        <div className="detail-actions">
          <Link to={`/brews/${brew.id}/edit`} className="btn">
            Edit
          </Link>
          <button
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm('Delete this brew session?'))
                deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <Field label="Date" value={formatDate(brew.createdAt)} />
        <Field label="Method" value={brew.method} />
        <Field label="Grind Size" value={brew.grindSize || '—'} />
        <Field label="Water Temp" value={brew.waterTemp ? `${brew.waterTemp}°C` : '—'} />
        <Field label="Brew Time" value={brew.brewTime ? `${brew.brewTime}s` : '—'} />
        <Field label="Coffee Dose" value={brew.coffeeDose ? `${brew.coffeeDose}g` : '—'} />
        <Field label="Water Dose" value={brew.waterDose ? `${brew.waterDose}ml` : '—'} />
        <Field label="Rating" value={stars(brew.rating)} />

        {brew.coffeeBean && (
          <Field
            label="Coffee Bean"
            value={`${brew.coffeeBean.name} (${brew.coffeeBean.roaster})${
              brew.coffeeBean.roastLevel
                ? ` — ${brew.coffeeBean.roastLevel} roast`
                : ''
            }`}
          />
        )}
      </div>

      {brew.notes && (
        <div className="detail-notes">
          <h3>Brew Notes</h3>
          <p>{brew.notes}</p>
        </div>
      )}

      <TastingNotesList brewId={brew.id} />
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="detail-field">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}

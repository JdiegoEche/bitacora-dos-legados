import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { brewsApi } from '../api/client';
import BrewDetailSkeleton from './skeletons/BrewDetailSkeleton';
import ConfirmDialog from './ConfirmDialog';
import BackLink from './BackLink';
import TastingNotesList from './TastingNotesList';
import { useToast } from '../contexts/ToastContext';

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
  const toast = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      toast.success('Preparación eliminada correctamente.');
      navigate('/bitacora');
    },
  });

  const shareMutation = useMutation({
    mutationFn: (isPublic: boolean) => brewsApi.toggleShare(brewId, isPublic),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['brew', brewId] });
      toast.success(
        variables
          ? 'Preparación compartida correctamente.'
          : 'Preparación ya no está compartida.',
      );
    },
    onError: (err: Error) => {
      toast.error(`Error al compartir: ${err.message}`);
    },
  });

  const handleShare = () => shareMutation.mutate(true);
  const handleUnshare = () => shareMutation.mutate(false);

  const handleCopyLink = () => {
    if (brew?.shareToken) {
      navigator.clipboard.writeText(
        `${window.location.origin}/shared/brews/${brew.shareToken}`,
      );
      toast.success('Link copiado al portapapeles.');
    }
  };

  if (Number.isNaN(brewId)) {
    return <div className="state-error">Invalid brew ID.</div>;
  }

  if (isLoading) return <BrewDetailSkeleton />;

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
      <BackLink
        label={brew.coffeeBeanId ? 'Café' : 'Bitácora'}
        to={brew.coffeeBeanId ? `/bitacora/${brew.coffeeBeanId}` : '/bitacora'}
      />
      <div className="detail-header">
        <h2>{brew.method} Brew</h2>
        <div className="detail-actions">
          <Link to={`/brews/${brew.id}/edit`} className="btn">
            Edit
          </Link>
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
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
        <Field label="Water Dose" value={brew.waterDose ? `${brew.waterDose}g` : '—'} />
        <Field label="Rating" value={stars(brew.rating ? Number(brew.rating) : null)} />

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

      {/* ── Share section ── */}
      <div className="share-section">
        <h3>Compartir preparación</h3>
        {!brew.isPublic ? (
          <button
            onClick={handleShare}
            className="btn"
            disabled={shareMutation.isPending}
          >
            {shareMutation.isPending ? 'Compartiendo…' : '🔗 Compartir'}
          </button>
        ) : (
          <div>
            <p className="share-info">✅ Pública — cualquiera con el link puede verla</p>
            {brew.shareToken && (
              <div className="share-link-row">
                <input
                  readOnly
                  value={`${window.location.origin}/shared/brews/${brew.shareToken}`}
                  className="input"
                />
                <button onClick={handleCopyLink} className="btn">
                  Copiar
                </button>
              </div>
            )}
            <button
              onClick={handleUnshare}
              className="btn btn-secondary"
              disabled={shareMutation.isPending}
              style={{ marginTop: '0.5rem' }}
            >
              Dejar de compartir
            </button>
          </div>
        )}
      </div>

      {brew.notes && (
        <div className="detail-notes">
          <h3>Notas</h3>
          <p>{brew.notes}</p>
        </div>
      )}

      <TastingNotesList brewId={brew.id} />

      {showDeleteDialog && (
        <ConfirmDialog
          title="¿Eliminar preparación?"
          message={`Se eliminará la preparación de ${brew.method} del ${new Date(brew.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })} y sus notas de cata asociadas.`}
          confirmLabel="Eliminar preparación"
          onConfirm={() => {
            setShowDeleteDialog(false);
            deleteMutation.mutate();
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
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

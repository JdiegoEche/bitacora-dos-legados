import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { beansApi } from '../api/client';
import BeanForm from './BeanForm';
import BeanDetailSkeleton from './skeletons/BeanDetailSkeleton';
import ConfirmDialog from './ConfirmDialog';
import BackLink from './BackLink';
import { useToast } from '../contexts/ToastContext';
import type { CoffeeBean, CoffeeBeanWithStats, BrewSessionWithNotes } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatOrigin(origin: string | null): string {
  return origin || '—';
}

function formatRoast(level: string | null): string {
  return level || '—';
}

function formatRating(rating: number | string | null): string {
  const num = typeof rating === 'string' ? Number(rating) : rating;
  return num != null ? `${num}/5` : '—';
}

function formatAvgRating(rating: number | null): string {
  return rating != null ? rating.toFixed(1) : '—';
}

// ─── Sub-components ───────────────────────────────────────────────────

function StatsSection({ stats }: { stats: CoffeeBeanWithStats }) {
  const methods = Object.entries(stats.methodBreakdown);

  return (
    <div className="detail-grid">
      <div className="detail-field">
        <span className="detail-label">Promedio</span>
        <span className="detail-value">{formatAvgRating(stats.avgRating)}</span>
      </div>
      <div className="detail-field">
        <span className="detail-label">Preparaciones</span>
        <span className="detail-value">{stats.brewCount}</span>
      </div>
      {methods.length > 0 && (
        <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
          <span className="detail-label">Métodos</span>
          <div className="method-tags">
            {methods.map(([method, count]) => (
              <span key={method} className="method-tag">
                {method}: {count}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTemp(temp: number | null): string {
  return temp != null ? `${temp}°C` : '—';
}

function formatSeconds(sec: number | null): string {
  return sec != null ? `${sec}s` : '—';
}

function formatGrams(g: number | null): string {
  return g != null ? `${g}g` : '—';
}

function formatMl(ml: number | null): string {
  return ml != null ? `${ml}ml` : '—';
}

function BrewHistory({ brews }: { brews: BrewSessionWithNotes[] }) {
  if (brews.length === 0) {
    return null;
  }

  return (
    <div>
      <h3>Historial de preparaciones</h3>
      <ol className="brew-history-list">
        {brews.map((brew) => (
          <li key={brew.id} className="brew-history-item">
            <Link
              to={`/brews/${brew.id}`}
              className="brew-history-link"
            >
              <div className="brew-history-header">
                <span className="brew-history-method">{brew.method}</span>
                <span className="brew-history-date">
                  {formatDate(brew.createdAt)}
                </span>
                <span className="brew-history-rating">
                  {formatRating(brew.rating)}
                </span>
              </div>
              <div className="brew-history-details">
                <Field label="Molienda" value={brew.grindSize} />
                <Field label="Temp. agua" value={formatTemp(brew.waterTemp)} />
                <Field label="Café" value={formatGrams(brew.coffeeDose)} />
                <Field label="Agua" value={formatMl(brew.waterDose)} />
                <Field label="Tiempo" value={formatSeconds(brew.brewTime ? Number(brew.brewTime) : null)} />
                <Field label="Molino" value={brew.grinder} />
                <Field label="Clicks" value={brew.clicks} />
              </div>
              {brew.notes && (
                <p className="brew-history-notes">{brew.notes}</p>
              )}
              {brew.tastingNotesSummary && (
                <p className="tasting-notes-summary">
                  🗒 {brew.tastingNotesSummary}
                </p>
              )}
              <span className="brew-history-chevron">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <span className="brew-field">
      <strong>{label}:</strong> {value}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function BeanDetail() {
  const { id } = useParams<{ id: string }>();
  const beanId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editingBean, setEditingBean] = useState<CoffeeBean | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['bean', beanId],
    queryFn: () => beansApi.getById(beanId),
    enabled: !Number.isNaN(beanId),
  });

  const {
    data: brews,
    isLoading: brewsLoading,
  } = useQuery({
    queryKey: ['bean-brews', beanId],
    queryFn: () => beansApi.getBrewsByBean(beanId),
    enabled: !Number.isNaN(beanId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => beansApi.delete(beanId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beans'] });
      navigate('/bitacora');
      toast.success('Café eliminado correctamente.');
    },
    onError: (err: Error) => {
      toast.error(`Error al eliminar: ${err.message}`);
    },
  });

  const handleDelete = () => deleteMutation.mutate();

  if (Number.isNaN(beanId)) {
    return (
      <div className="state-msg state-error">ID de café inválido.</div>
    );
  }

  if (statsLoading || brewsLoading) {
    return <BeanDetailSkeleton />;
  }

  if (statsError) {
    return (
      <div className="state-msg state-error">
        Error al cargar el café. ¿Está el backend funcionando?
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="state-msg state-error">Café no encontrado.</div>
    );
  }

  const hasBrews = brews && brews.length > 0;

  return (
    <div>
      <BackLink label="Bitácora" />
      <div className="detail-header">
        <div>
          <h2>{stats.name}</h2>
          <p className="bean-subtitle">
            {stats.roaster} · {formatOrigin(stats.origin)} ·{' '}
            {formatRoast(stats.roastLevel)}
          </p>
        </div>
        <div className="detail-actions">
          <button
            className="btn"
            onClick={() => setEditingBean(stats)}
          >
            Editar
          </button>
          <button
            className="btn btn-danger"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Eliminando…' : 'Eliminar'}
          </button>
          <Link
            to={`/bitacora/${beanId}/brews/new`}
            className="btn"
          >
            + Nueva preparación
          </Link>
        </div>
      </div>

      <StatsSection stats={stats} />

      {hasBrews ? (
        <BrewHistory brews={brews} />
      ) : (
        <div className="empty-state">
          <p>Sin preparaciones aún.</p>
          <Link
            to={`/bitacora/${beanId}/brews/new`}
            className="btn"
          >
            + Nueva preparación
          </Link>
        </div>
      )}

      {editingBean && (
        <BeanForm
          bean={editingBean}
          onClose={() => setEditingBean(null)}
        />
      )}

      {showDeleteDialog && (
        <ConfirmDialog
          title="¿Eliminar café?"
          message={`Se eliminará «${stats.name}» de ${stats.roaster} y todas sus preparaciones. Esta acción no se puede deshacer.`}
          details={
            brews && brews.length > 0
              ? `${brews.length} preparación(es) serán eliminadas`
              : undefined
          }
          confirmLabel="Eliminar café"
          onConfirm={() => {
            setShowDeleteDialog(false);
            handleDelete();
          }}
          onCancel={() => setShowDeleteDialog(false)}
        />
      )}
    </div>
  );
}

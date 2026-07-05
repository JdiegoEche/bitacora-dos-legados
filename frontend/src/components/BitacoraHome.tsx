import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { beansApi } from '../api/client';
import BeanForm from './BeanForm';
import BitacoraHomeSkeleton from './skeletons/BitacoraHomeSkeleton';
import StatsPanel from './StatsPanel';
import type { CoffeeBean } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatOrigin(origin: string | null): string {
  return origin || '—';
}

function formatRoast(level: string | null): string {
  return level || '—';
}

// ─── Stats Bentobox ───────────────────────────────────────────────────

function StatsSummary({ beans }: { beans: CoffeeBean[] }) {
  const stats = useMemo(() => {
    const roasters = new Set(beans.map(b => b.roaster));
    const origins = new Set(beans.map(b => b.origin).filter(Boolean));
    return {
      total: beans.length,
      roasters: roasters.size,
      origins: origins.size,
    };
  }, [beans]);

  const items = [
    { label: 'Cafés', value: stats.total, icon: 'beans' },
    { label: 'Tostadores', value: stats.roasters, icon: 'roaster' },
    { label: 'Orígenes', value: stats.origins, icon: 'origin' },
  ] as const;

  return (
    <div className="stats-bento">
      {items.map((item) => (
        <div key={item.label} className="stat-card">
          <div className="stat-icon">
            {item.icon === 'beans' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2C8 2 4 5 4 9c0 3 2 6 4 8s4 5 4 5" />
                <path d="M12 2c4 0 8 3 8 7 0 3-2 6-4 8s-4 5-4 5" />
              </svg>
            )}
            {item.icon === 'roaster' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            )}
            {item.icon === 'origin' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            )}
          </div>
          <div className="stat-value">{item.value}</div>
          <div className="stat-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────

export default function BitacoraHome() {
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    data: beans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beans'],
    queryFn: beansApi.list,
  });

  if (isLoading) {
    return <BitacoraHomeSkeleton />;
  }

  if (error) {
    return (
      <div className="state-msg state-error">
        Error al cargar cafés. ¿Está el backend funcionando?
      </div>
    );
  }

  if (!beans || beans.length === 0) {
    return (
      <div>
        <div className="detail-header">
          <h2>Bitácora</h2>
          <button onClick={() => setShowAddForm(true)} className="btn">
            + Crear café
          </button>
        </div>

        <div className="empty-state">
          <p>No hay cafés todavía. ¡Agregá tu primer café!</p>
        </div>

        {showAddForm && (
          <BeanForm onClose={() => setShowAddForm(false)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="detail-header">
        <h2>Bitácora</h2>
        <button onClick={() => setShowAddForm(true)} className="btn">
          + Crear café
        </button>
      </div>

      <StatsSummary beans={beans} />

      <StatsPanel />

      <div className="bean-card-grid">
        {beans.map((bean: CoffeeBean) => (
          <Link
            key={bean.id}
            to={`/bitacora/${bean.id}`}
            className="bean-card"
          >
            <h3 className="bean-card-name">{bean.name}</h3>
            <div className="bean-card-meta">
              <span className="bean-card-roaster">{bean.roaster}</span>
              <span className="bean-card-origin">{formatOrigin(bean.origin)}</span>
              <span className="bean-card-roast">{formatRoast(bean.roastLevel)}</span>
            </div>
          </Link>
        ))}
      </div>

      {showAddForm && (
        <BeanForm onClose={() => setShowAddForm(false)} />
      )}
    </div>
  );
}

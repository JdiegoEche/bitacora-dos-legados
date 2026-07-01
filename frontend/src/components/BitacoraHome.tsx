import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { beansApi } from '../api/client';
import BeanForm from './BeanForm';
import type { CoffeeBean } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────

function formatOrigin(origin: string | null): string {
  return origin || '—';
}

function formatRoast(level: string | null): string {
  return level || '—';
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
    return <div className="state-msg">Cargando cafés…</div>;
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

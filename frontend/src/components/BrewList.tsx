import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { brewsApi, beansApi } from '../api/client';
import type { CoffeeBean } from '../types';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BrewList() {
  const {
    data: brews,
    isLoading: brewsLoading,
    error: brewsError,
  } = useQuery({
    queryKey: ['brews'],
    queryFn: brewsApi.list,
  });

  const { data: beans } = useQuery({
    queryKey: ['beans'],
    queryFn: beansApi.list,
  });

  const beanMap = useMemo(() => {
    const map = new Map<number, CoffeeBean>();
    beans?.forEach((b) => map.set(b.id, b));
    return map;
  }, [beans]);

  if (brewsLoading) return <div className="state-msg">Loading brews…</div>;

  if (brewsError) {
    return (
      <div className="state-msg state-error">
        Failed to load brews. Is the backend running?
      </div>
    );
  }

  if (!brews || brews.length === 0) {
    return (
      <div className="empty-state">
        <h2>Brew Sessions</h2>
        <p>No brew sessions yet.</p>
        <Link to="/brews/new">Log your first brew</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Brew Sessions</h2>
      <table className="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Method</th>
            <th>Bean</th>
            <th>Rating</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {brews.map((brew) => {
            const bean =
              brew.coffeeBeanId != null
                ? beanMap.get(brew.coffeeBeanId)
                : undefined;
            return (
              <tr key={brew.id}>
                <td>{formatDate(brew.createdAt)}</td>
                <td>{brew.method}</td>
                <td>
                  {bean
                    ? `${bean.name} (${bean.roaster})`
                    : '—'}
                </td>
                <td className="rating-cell">
                  {brew.rating != null
                    ? `${brew.rating}/5`
                    : '—'}
                </td>
                <td>
                  <Link to={`/brews/${brew.id}`}>View</Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

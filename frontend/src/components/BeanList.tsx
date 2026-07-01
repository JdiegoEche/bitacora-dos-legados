import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { beansApi } from '../api/client';
import BeanForm from './BeanForm';
import type { CoffeeBean } from '../types';

// ─── Component ──────────────────────────────────────────────────────────────

export default function BeanList() {
  const queryClient = useQueryClient();

  const [editingBean, setEditingBean] = useState<CoffeeBean | undefined>();
  const [showAddForm, setShowAddForm] = useState(false);

  const {
    data: beans,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['beans'],
    queryFn: beansApi.list,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => beansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beans'] });
      queryClient.invalidateQueries({ queryKey: ['brews'] });
    },
  });

  const handleDelete = (bean: CoffeeBean) => {
    if (
      !window.confirm(
        `Delete "${bean.name}"? Brews referencing this bean will have their bean unset, but will not be deleted.`,
      )
    ) {
      return;
    }
    deleteMutation.mutate(bean.id);
  };

  if (isLoading) return <div className="state-msg">Loading beans…</div>;

  if (error) {
    return (
      <div className="state-msg state-error">
        Failed to load beans. Is the backend running?
      </div>
    );
  }

  return (
    <div>
      <div className="detail-header">
        <h2>Coffee Beans</h2>
        <button onClick={() => setShowAddForm(true)} className="btn">
          + Add Bean
        </button>
      </div>

      {(!beans || beans.length === 0) && (
        <div className="empty-state">
          <p>No coffee beans yet. Add your first one!</p>
        </div>
      )}

      {beans && beans.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Roaster</th>
              <th>Origin</th>
              <th>Roast Level</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {beans.map((bean) => (
              <tr key={bean.id}>
                <td>{bean.name}</td>
                <td>{bean.roaster}</td>
                <td>{bean.origin || '—'}</td>
                <td>{bean.roastLevel || '—'}</td>
                <td className="actions-cell">
                  <button
                    onClick={() => setEditingBean(bean)}
                    className="btn btn-small"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(bean)}
                    className="btn btn-small btn-danger"
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Delete in-progress indicator shown only during mutation */}
      {deleteMutation.isPending && (
        <div className="state-msg">Deleting…</div>
      )}

      {deleteMutation.isError && (
        <div className="state-error">
          Failed to delete: {(deleteMutation.error as Error).message}
        </div>
      )}

      {/* Add modal */}
      {showAddForm && (
        <BeanForm onClose={() => setShowAddForm(false)} />
      )}

      {/* Edit modal */}
      {editingBean != null && (
        <BeanForm
          bean={editingBean}
          onClose={() => setEditingBean(undefined)}
        />
      )}
    </div>
  );
}

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { beansApi } from '../api/client';
import type { CoffeeBean, CreateBeanData } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BeanFormProps {
  /** Existing bean for edit mode, or undefined for create mode. */
  bean?: CoffeeBean;
  onClose: () => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BeanForm({ bean, onClose }: BeanFormProps) {
  const isEdit = bean != null;
  const queryClient = useQueryClient();

  const [name, setName] = useState(bean?.name ?? '');
  const [roaster, setRoaster] = useState(bean?.roaster ?? '');
  const [origin, setOrigin] = useState(bean?.origin ?? '');
  const [roastLevel, setRoastLevel] = useState(bean?.roastLevel ?? '');

  const mutation = useMutation({
    mutationFn: (data: CreateBeanData) =>
      isEdit ? beansApi.update(bean.id, data) : beansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beans'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    mutation.mutate({
      name: name.trim(),
      roaster: roaster.trim(),
      origin: origin.trim() || null,
      roastLevel: roastLevel.trim() || null,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <form
        className="modal form"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2>{isEdit ? 'Edit Bean' : 'Add New Bean'}</h2>

        <label className="field">
          Name *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ethiopia Yirgacheffe"
            className="input"
          />
        </label>

        <label className="field">
          Roaster *
          <input
            required
            value={roaster}
            onChange={(e) => setRoaster(e.target.value)}
            placeholder="Counter Culture"
            className="input"
          />
        </label>

        <label className="field">
          Origin
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Ethiopia"
            className="input"
          />
        </label>

        <label className="field">
          Roast Level
          <select
            value={roastLevel}
            onChange={(e) => setRoastLevel(e.target.value)}
            className="input"
          >
            <option value="">— Select —</option>
            <option value="light">Light</option>
            <option value="medium-light">Medium-Light</option>
            <option value="medium">Medium</option>
            <option value="medium-dark">Medium-Dark</option>
            <option value="dark">Dark</option>
          </select>
        </label>

        {mutation.isError && (
          <div className="state-error">
            {(mutation.error as Error).message}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn">
            {mutation.isPending
              ? 'Saving…'
              : isEdit
                ? 'Update Bean'
                : 'Add Bean'}
          </button>
        </div>
      </form>
    </div>
  );
}

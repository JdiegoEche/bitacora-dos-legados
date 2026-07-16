import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { beansApi } from '../api/client';
import type { CoffeeBean, CreateBeanData } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BeanFormProps {
  /** Existing bean for edit mode, or undefined for create mode. */
  bean?: CoffeeBean;
  onClose: () => void;
  /** Called with the created bean after successful creation. */
  onCreated?: (bean: CoffeeBean) => void;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BeanForm({ bean, onClose, onCreated }: BeanFormProps) {
  const isEdit = bean != null;
  const queryClient = useQueryClient();

  const [name, setName] = useState(bean?.name ?? '');
  const [roaster, setRoaster] = useState(bean?.roaster ?? '');
  const [origin, setOrigin] = useState(bean?.origin ?? '');
  const [roastLevel, setRoastLevel] = useState(bean?.roastLevel ?? '');

  const mutation = useMutation({
    mutationFn: (data: CreateBeanData) =>
      isEdit ? beansApi.update(bean.id, data) : beansApi.create(data),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['beans'] });
      onCreated?.(created);
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
        <h2>{isEdit ? 'Editar Café' : 'Agregar Café'}</h2>

        <label className="field">
          Nombre *
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dos legados tradicional"
            className="input"
          />
        </label>

        <label className="field">
          Tostador *
          <input
            required
            value={roaster}
            onChange={(e) => setRoaster(e.target.value)}
            placeholder="Dos legados"
            className="input"
          />
        </label>

        <label className="field">
          Origen
          <input
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            placeholder="Colombia"
            className="input"
          />
        </label>

        <label className="field">
          Nivel de tueste
          <select
            value={roastLevel}
            onChange={(e) => setRoastLevel(e.target.value)}
            className="input"
          >
            <option value="">— Seleccionar —</option>
            <option value="light">Claro</option>
            <option value="medium-light">Medio-Claro</option>
            <option value="medium">Medio</option>
            <option value="medium-dark">Medio con desarrollo</option>
            <option value="dark">Alta</option>
          </select>
        </label>

        {mutation.isError && (
          <div className="state-error">
            {(mutation.error as Error).message}
          </div>
        )}

        <div className="modal-actions">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button type="submit" disabled={mutation.isPending} className="btn">
            {mutation.isPending
              ? 'Guardando…'
              : isEdit
                ? 'Actualizar Café'
                : 'Agregar Café'}
          </button>
        </div>
      </form>
    </div>
  );
}

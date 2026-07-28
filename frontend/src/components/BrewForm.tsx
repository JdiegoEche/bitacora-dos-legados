import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { brewsApi, beansApi } from '../api/client';
import BackLink from './BackLink';
import type { CreateBrewData } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BrewFormProps {
  /** When set, the form operates in edit mode (PUT). */
  brewId?: number;
  /** Pre-fill values for edit mode. */
  initialData?: CreateBrewData;
  /** When set, bean selector is hidden and coffeeBeanId is auto-assigned. */
  preSelectedBeanId?: number;
}

/** Internal string-based form state so empty number fields send '' not 0. */
interface FormState {
  method: string;
  grindSize: string;
  waterTemp: string;
  brewTime: string;
  grinder: string;
  clicks: string;
  coffeeDose: string;
  waterDose: string;
  coffeeBeanId: string;
  notes: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function createFormState(data?: CreateBrewData): FormState {
  return {
    method: data?.method ?? '',
    grindSize: data?.grindSize ?? '',
    waterTemp: data?.waterTemp ? String(data.waterTemp) : '',
    brewTime: data?.brewTime ? String(data.brewTime) : '',
    grinder: data?.grinder ?? '',
    clicks: data?.clicks ?? '',
    coffeeDose: data?.coffeeDose ? String(data.coffeeDose) : '',
    waterDose: data?.waterDose ? String(data.waterDose) : '',
    coffeeBeanId: data?.coffeeBeanId ? String(data.coffeeBeanId) : '',
    notes: data?.notes ?? '',
  };
}

function computeRatio(coffeeDose: number, waterDose: number): string | null {
  if (!coffeeDose || !waterDose) return null;
  const ratio = Math.round(waterDose / coffeeDose);
  return `1:${ratio}`;
}

function toPayload(f: FormState, preSelectedBeanId?: number): CreateBrewData {
  return {
    method: f.method,
    grindSize: f.grindSize,
    waterTemp: Number(f.waterTemp),
    brewTime: String(f.brewTime),
    grinder: f.grinder || null,
    clicks: f.clicks || null,
    coffeeDose: Number(f.coffeeDose),
    waterDose: Number(f.waterDose),
    coffeeBeanId: preSelectedBeanId ?? (f.coffeeBeanId ? Number(f.coffeeBeanId) : null),
    notes: f.notes || null,
    rating: computeRatio(Number(f.coffeeDose), Number(f.waterDose)),
  };
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function BrewForm({ brewId, initialData, preSelectedBeanId }: BrewFormProps) {
  const isEdit = brewId != null;
  const hasPreselected = preSelectedBeanId != null;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: beans } = useQuery({
    queryKey: ['beans'],
    queryFn: beansApi.list,
    enabled: !hasPreselected,
  });

  const [form, setForm] = useState<FormState>(() =>
    createFormState(initialData),
  );

  const mutation = useMutation({
    mutationFn: (data: CreateBrewData) =>
      isEdit
        ? brewsApi.update(brewId, data)
        : brewsApi.create(data),
    onSuccess: (brew) => {
      if (hasPreselected) {
        queryClient.invalidateQueries({ queryKey: ['bean-brews', preSelectedBeanId] });
        navigate(`/bitacora/${preSelectedBeanId}`);
      } else {
        queryClient.invalidateQueries({ queryKey: ['brews'] });
        navigate(`/brews/${brew.id}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(toPayload(form, preSelectedBeanId));
  };

  const set = (field: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const backTo = brewId
    ? `/brews/${brewId}`
    : preSelectedBeanId
      ? `/bitacora/${preSelectedBeanId}`
      : '/bitacora';

  const backLabel = brewId ? 'Preparación' : preSelectedBeanId ? 'Café' : 'Bitácora';

  return (
    <div>
      <BackLink label={backLabel} to={backTo} />
      <h2>{isEdit ? 'Editar preparación' : 'Nueva preparación'}</h2>

      <form onSubmit={handleSubmit} className="form">
        <label className="field">
          Método *
          <input
            required
            value={form.method}
            onChange={(e) => set('method', e.target.value)}
            placeholder="V60, Aeropress, French Press…"
            className="input"
          />
        </label>

        <label className="field">
          Molienda *
          <select
            required
            value={form.grindSize}
            onChange={(e) => set('grindSize', e.target.value)}
            className="input"
          >
            <option value="">— Seleccionar —</option>
            <option value="Muy fina">Muy fina</option>
            <option value="Fina">Fina</option>
            <option value="Medio-fina">Medio-fina</option>
            <option value="Media">Media</option>
            <option value="Media-gruesa">Media-gruesa</option>
            <option value="Gruesa">Gruesa</option>
          </select>
        </label>

        <div className="field-row">
          <label className="field">
            Temp. agua (°C) *
            <input
              required
              type="number"
              min={1}
              value={form.waterTemp}
              onChange={(e) => set('waterTemp', e.target.value)}
              className="input"
            />
          </label>

          <label className="field">
            Tiempo *
            <input
              required
              type="text"
              value={form.brewTime}
              onChange={(e) => set('brewTime', e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            Molino
            <input
              value={form.grinder}
              onChange={(e) => set('grinder', e.target.value)}
              placeholder="Comandante, Timemore....."
              className="input"
            />
          </label>

          <label className="field">
            Clicks
            <input
              value={form.clicks}
              onChange={(e) => set('clicks', e.target.value)}
              placeholder="15, 22, 30…"
              className="input"
            />
          </label>
        </div>

        {!hasPreselected && (
          <label className="field">
            Café
            <select
              value={form.coffeeBeanId}
              onChange={(e) => set('coffeeBeanId', e.target.value)}
              className="input"
            >
              <option value="">-- Seleccionar café --</option>
              {beans?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.roaster})
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="field-row">
          <label className="field">
            Café (g) *
            <input
              required
              type="number"
              min={0.1}
              step={0.1}
              value={form.coffeeDose}
              onChange={(e) => set('coffeeDose', e.target.value)}
              className="input"
            />
          </label>

          <label className="field">
            Agua (g) *
            <input
              required
              type="number"
              min={0.1}
              step={0.1}
              value={form.waterDose}
              onChange={(e) => set('waterDose', e.target.value)}
              className="input"
            />
          </label>
        </div>

        <div className="field-row">
          <label className="field">
            Ratio
            <output className="input ratio-output">
              {computeRatio(
                Number(form.coffeeDose),
                Number(form.waterDose),
              ) ?? '—'}
            </output>
          </label>
        </div>

    

        {mutation.isError && (
          <div className="state-error">
            {(mutation.error as Error).message}
          </div>
        )}

        <button type="submit" disabled={mutation.isPending} className="btn">
          {mutation.isPending
            ? 'Guardando…'
            : isEdit
              ? 'Actualizar'
              : 'Guardar'}
        </button>
      </form>
    </div>
  );
}

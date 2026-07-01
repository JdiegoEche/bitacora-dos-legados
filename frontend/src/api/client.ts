import type {
  BrewSession,
  BrewSessionDetail,
  CoffeeBean,
  CoffeeBeanWithStats,
  BrewSessionWithNotes,
  TastingNote,
  CreateBrewData,
  CreateBeanData,
  CreateNoteData,
} from '../types';

// ─── Error class ────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Generic helpers ────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Brews ──────────────────────────────────────────────────────────────────

export const brewsApi = {
  list: () => request<BrewSession[]>('/api/brews'),

  getById: (id: number) =>
    request<BrewSessionDetail>(`/api/brews/${id}`),

  create: (data: CreateBrewData) =>
    request<BrewSession>('/api/brews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateBrewData>) =>
    request<BrewSession>(`/api/brews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/api/brews/${id}`, { method: 'DELETE' }),
};

// ─── Beans ──────────────────────────────────────────────────────────────────

export const beansApi = {
  list: () => request<CoffeeBean[]>('/api/beans'),

  getById: (id: number) =>
    request<CoffeeBeanWithStats>(`/api/beans/${id}`),

  getBrewsByBean: (id: number) =>
    request<BrewSessionWithNotes[]>(`/api/beans/${id}/brews`),

  create: (data: CreateBeanData) =>
    request<CoffeeBean>('/api/beans', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<CreateBeanData>) =>
    request<CoffeeBean>(`/api/beans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/api/beans/${id}`, { method: 'DELETE' }),
};

// ─── Tasting Notes ──────────────────────────────────────────────────────────

export const notesApi = {
  listByBrew: (brewId: number) =>
    request<TastingNote[]>(`/api/brews/${brewId}/notes`),

  create: (brewId: number, data: CreateNoteData) =>
    request<TastingNote>(`/api/brews/${brewId}/notes`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
};

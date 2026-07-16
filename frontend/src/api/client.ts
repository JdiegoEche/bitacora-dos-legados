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
  Recipe,
  RecipeDetail,
  User,
} from '../types';

// ─── Auth token management ──────────────────────────────────────────────────

const TOKEN_KEY = 'bitacora-auth-token';

let authToken: string | null = (() => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function setAuthToken(token: string | null): void {
  authToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export function clearAuthToken(): void {
  setAuthToken(null);
}

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

const API_BASE = (import.meta as any).env.VITE_API_URL || '';

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
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

  toggleShare: (id: number, isPublic: boolean) =>
    request<{ isPublic: boolean; shareToken: string | null }>(`/api/brews/${id}/share`, {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    }),

  getPublic: async (shareToken: string) => {
    const brew = await request<BrewSessionDetail>(`/api/public/brews/${shareToken}`);
    return { brew };
  },
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

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email: string) =>
    request<{ ok: boolean; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  me: () => request<User>('/api/auth/me'),
};

// ─── Recipes ────────────────────────────────────────────────────────────────

export const recipesApi = {
  list: (method?: string) =>
    request<Recipe[]>(`/api/recipes${method ? `?method=${method}` : ''}`),

  getById: (id: number) =>
    request<RecipeDetail>(`/api/recipes/${id}`),
};

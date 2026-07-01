/**
 * Shared test utilities for component tests.
 * Provides a wrapper with QueryClientProvider + MemoryRouter.
 */
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, RenderOptions } from '@testing-library/react';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
}

interface WrapperOptions {
  initialEntries?: string[];
  /** Optional route path pattern for components that use useParams.
   *  E.g., '/bitacora/:id' for a component that reads :id from params. */
  routePath?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: WrapperOptions & Omit<RenderOptions, 'wrapper'>,
) {
  const queryClient = createTestQueryClient();
  const initialEntries = options?.initialEntries ?? ['/'];
  const routePath = options?.routePath;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          {routePath ? (
            <Routes>
              <Route path={routePath} element={children} />
            </Routes>
          ) : (
            children
          )}
        </MemoryRouter>
      </QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

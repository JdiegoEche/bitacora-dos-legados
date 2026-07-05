import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

const Layout = lazy(() => import('./components/Layout'));
const LandingPage = lazy(() => import('./components/LandingPage'));
const LoginPage = lazy(() => import('./components/LoginPage'));
const BrewForm = lazy(() => import('./components/BrewForm'));
const BrewDetail = lazy(() => import('./components/BrewDetail'));
const BrewEdit = lazy(() => import('./components/BrewEdit'));
const BitacoraHome = lazy(() => import('./components/BitacoraHome'));
const BeanDetail = lazy(() => import('./components/BeanDetail'));
const RecipeMethodGrid = lazy(() => import('./components/recipes/RecipeMethodGrid'));
const RecipeList = lazy(() => import('./components/recipes/RecipeList'));
const RecipeDetail = lazy(() => import('./components/recipes/RecipeDetail'));
const SharedBrewView = lazy(() => import('./components/SharedBrewView'));

// ─── Route Wrappers ──────────────────────────────────────────────────────

/** Passes :id from the URL as preSelectedBeanId to BrewForm. */
function BrewFormWithBean() {
  const { id } = useParams<{ id: string }>();
  return <BrewForm preSelectedBeanId={Number(id)} />;
}

// ─── App ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Suspense fallback={<div className="state-msg">Cargando…</div>}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/bitacora" element={<ProtectedRoute><BitacoraHome /></ProtectedRoute>} />
              <Route path="/bitacora/:id" element={<ProtectedRoute><BeanDetail /></ProtectedRoute>} />
              <Route path="/bitacora/:id/brews/new" element={<ProtectedRoute><BrewFormWithBean /></ProtectedRoute>} />
              <Route path="/brews/:id" element={<ProtectedRoute><BrewDetail /></ProtectedRoute>} />
              <Route path="/brews/:id/edit" element={<ProtectedRoute><BrewEdit /></ProtectedRoute>} />
              <Route path="/recetas" element={<RecipeMethodGrid />} />
              <Route path="/recetas/:method" element={<RecipeList />} />
              <Route path="/recetas/:method/:id" element={<RecipeDetail />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/shared/brews/:shareToken" element={<SharedBrewView />} />
          </Routes>
        </Suspense>
      </ThemeProvider>
    </AuthProvider>
  );
}

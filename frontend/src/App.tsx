import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import BrewForm from './components/BrewForm';
import BrewDetail from './components/BrewDetail';
import BrewEdit from './components/BrewEdit';
import BitacoraHome from './components/BitacoraHome';
import BeanDetail from './components/BeanDetail';
import RecipeMethodGrid from './components/recipes/RecipeMethodGrid';
import RecipeList from './components/recipes/RecipeList';
import RecipeDetail from './components/recipes/RecipeDetail';

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
        </Routes>
      </ThemeProvider>
    </AuthProvider>
  );
}

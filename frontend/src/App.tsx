import { Routes, Route, Navigate, useParams } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import BrewForm from './components/BrewForm';
import BrewDetail from './components/BrewDetail';
import BrewEdit from './components/BrewEdit';
import BitacoraHome from './components/BitacoraHome';
import BeanDetail from './components/BeanDetail';

// ─── Route Wrappers ──────────────────────────────────────────────────────

/** Passes :id from the URL as preSelectedBeanId to BrewForm. */
function BrewFormWithBean() {
  const { id } = useParams<{ id: string }>();
  return <BrewForm preSelectedBeanId={Number(id)} />;
}

// ─── App ─────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/bitacora" element={<BitacoraHome />} />
          <Route path="/bitacora/:id" element={<BeanDetail />} />
          <Route path="/bitacora/:id/brews/new" element={<BrewFormWithBean />} />
          <Route path="/brews/:id" element={<BrewDetail />} />
          <Route path="/brews/:id/edit" element={<BrewEdit />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

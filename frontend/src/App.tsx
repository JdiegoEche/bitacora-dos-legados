import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import BrewList from './components/BrewList';
import BrewForm from './components/BrewForm';
import BrewDetail from './components/BrewDetail';
import BrewEdit from './components/BrewEdit';
import BeanList from './components/BeanList';

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/bitacora" element={<BrewList />} />
          <Route path="/brews/new" element={<BrewForm />} />
          <Route path="/brews/:id" element={<BrewDetail />} />
          <Route path="/brews/:id/edit" element={<BrewEdit />} />
          <Route path="/beans" element={<BeanList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="layout">
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            Bitácora Café
          </Link>

          <div className="nav-links">
            <Link to="/bitacora" className="nav-link">Bitácora</Link>
            <Link to="/brews/new" className="nav-link">New Brew</Link>
            <Link to="/beans" className="nav-link">Beans</Link>
          </div>

          <button
            className="nav-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
          >
            {theme === 'dark' ? '☀' : '☾'}
          </button>
        </div>
      </nav>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <span>Bitácora Café</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

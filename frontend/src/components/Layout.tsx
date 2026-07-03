import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="layout">
      <nav className="nav">
        <div className="nav-inner">
          <Link to="/" className="nav-logo">
            Bitácora Café
          </Link>

          <div className="nav-links">
            <Link to="/bitacora" className="nav-link">Bitácora</Link>
            <Link to="/recetas" className="nav-link">Recetas</Link>
          </div>

          <div className="nav-actions">
            {isAuthenticated && user ? (
              <>
                <span className="nav-user-email">{user.email}</span>
                <button className="nav-logout" onClick={logout}>
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link to="/login" className="nav-link nav-login-link">
                Iniciar sesión
              </Link>
            )}

            <button
              className="nav-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
              title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? '☀' : '☾'}
            </button>
          </div>
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

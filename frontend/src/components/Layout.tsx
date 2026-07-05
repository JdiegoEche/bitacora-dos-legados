import { useState, useRef, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer click afuera
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [menuOpen]);

  return (
    <ToastProvider>
      <div className="layout">
        <nav className="nav">
          <div className="nav-inner">
            <Link to="/" className="nav-logo">
              Bitácora Café
            </Link>

            {/* Hamburger — visible solo en mobile */}
            <button
              className="nav-hamburger"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={menuOpen}
            >
              <span className={`nav-hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`nav-hamburger-line ${menuOpen ? 'open' : ''}`} />
              <span className={`nav-hamburger-line ${menuOpen ? 'open' : ''}`} />
            </button>

            {/* Menú colapsable */}
            <div
              ref={menuRef}
              className={`nav-menu ${menuOpen ? 'nav-menu--open' : ''}`}
            >
              <div className="nav-links">
                <Link
                  to="/bitacora"
                  className="nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Bitácora
                </Link>
                <Link
                  to="/recetas"
                  className="nav-link"
                  onClick={() => setMenuOpen(false)}
                >
                  Recetas
                </Link>
              </div>

              <div className="nav-actions">
                {isAuthenticated && user ? (
                  <>
                    <span className="nav-user-email">{user.email}</span>
                    <button className="nav-logout" onClick={() => { logout(); setMenuOpen(false); }}>
                      Cerrar sesión
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="nav-link nav-login-link"
                    onClick={() => setMenuOpen(false)}
                  >
                    Iniciar sesión
                  </Link>
                )}

                <button
                  className="nav-theme-toggle"
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                  title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
                >
                  {theme === 'dark' ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5" />
                      <line x1="12" y1="1" x2="12" y2="3" />
                      <line x1="12" y1="21" x2="12" y2="23" />
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                      <line x1="1" y1="12" x2="3" y2="12" />
                      <line x1="21" y1="12" x2="23" y2="12" />
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </div>
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
    </ToastProvider>
  );
}

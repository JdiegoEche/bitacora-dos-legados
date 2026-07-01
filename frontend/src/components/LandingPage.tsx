import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div className="landing">
      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">Bitácora Café</h1>
          <p className="hero-subtitle">
            Registrá tus recetas de café, tomá notas, mejorá tu técnica
          </p>
        </div>
        <div className="hero-visual" aria-hidden="true" />
      </section>

      {/* ── CTA Cards ──────────────────────────────────────────── */}
      <section className="cta-grid">
        {/* Bitácora — active link */}
        <Link to="/bitacora" className="cta-card">
          <div className="cta-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="14" y2="11" />
            </svg>
          </div>
          <h3 className="cta-title">Bitácora</h3>
          <p className="cta-desc">
            Explorá tus recetas guardadas, revisá métodos y resultados de cada
            preparación.
          </p>
        </Link>

        {/* Recetas — placeholder */}
        <div className="cta-card cta-card--placeholder">
          <div className="cta-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
              <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
              <line x1="6" y1="1" x2="6" y2="4" />
              <line x1="10" y1="1" x2="10" y2="4" />
              <line x1="14" y1="1" x2="14" y2="4" />
            </svg>
          </div>
          <h3 className="cta-title">Recetas</h3>
          <p className="cta-desc">
            Creá y editá recetas detalladas con métodos, proporciones y notas de
            catación.
          </p>
          <span className="cta-badge">Próximamente</span>
        </div>

        {/* Diario — placeholder */}
        <div className="cta-card cta-card--placeholder">
          <div className="cta-icon">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h3 className="cta-title">Diario</h3>
          <p className="cta-desc">
            Llevá un registro personal de cada cafeína del día con notas,
            estados de ánimo y momentos.
          </p>
          <span className="cta-badge">Próximamente</span>
        </div>
      </section>
    </div>
  );
}

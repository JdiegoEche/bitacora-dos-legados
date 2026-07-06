// ─── Back Link ──────────────────────────────────────────────────────────────
// Reusable back-navigation link for detail pages.
// Follows ui-ux-pro-max: touch target ≥44pt, SVG arrow, accessible label.

import { Link, useNavigate, type To } from 'react-router-dom';

interface BackLinkProps {
  /** Visible label text (e.g. "Bitácora", "Café"). */
  label: string;
  /** Explicit target URL. When omitted, uses browser history (-1). */
  to?: To;
  /** Additional CSS class. */
  className?: string;
}

export default function BackLink({ label, to, className }: BackLinkProps) {
  const navigate = useNavigate();

  const handleBackClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(-1);
  };

  if (to) {
    return (
      <Link
        to={to}
        className={`back-link ${className ?? ''}`}
        aria-label={`Volver a ${label}`}
      >
        <ArrowIcon />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <a
      href="#"
      onClick={handleBackClick}
      className={`back-link ${className ?? ''}`}
      aria-label={`Volver a ${label}`}
    >
      <ArrowIcon />
      <span>{label}</span>
    </a>
  );
}

function ArrowIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

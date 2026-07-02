/**
 * Inline SVG icons for each brewing method.
 *
 * Each icon is a React component with default 48×48 viewBox,
 * uses currentColor for fill/stroke, and is accessible via aria-label.
 */
import React from 'react';

interface IconProps {
  size?: number;
}

// ─── V60 — Classic cone with spiral ridges ───────────────────────────

export function V60Icon({ size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="V60"
    >
      {/* Cone body */}
      <path
        d="M10 40 L24 6 L38 40 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Rim */}
      <path
        d="M6 40 L42 40"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Spiral ridges */}
      <path
        d="M14 34 Q20 28 24 22 Q28 28 34 34"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M17 30 Q21 25 24 20 Q27 25 31 30"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M20 26 Q22 22 24 18 Q26 22 28 26"
        stroke="currentColor"
        strokeWidth="1.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Stem */}
      <rect x="22" y="40" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

// ─── Switch — V60-like with a lever at bottom ────────────────────────

export function SwitchIcon({ size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Hario Switch"
    >
      {/* Cone body */}
      <path
        d="M12 38 L24 8 L36 38 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Rim */}
      <path
        d="M8 38 L40 38"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Switch lever base */}
      <rect x="21" y="38" width="6" height="3" rx="1" fill="currentColor" />
      {/* Switch lever — toggle arm going right */}
      <path
        d="M27 39 L34 36"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Lever knob */}
      <circle cx="35" cy="35.5" r="2" fill="currentColor" />
      {/* Stem */}
      <rect x="22" y="41" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

// ─── Origami — Wider cone with geometric fold lines ──────────────────

export function OrigamiIcon({ size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Origami Dripper"
    >
      {/* Wider cone body */}
      <path
        d="M6 40 L24 6 L42 40 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Rim */}
      <path
        d="M2 40 L46 40"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Geometric fold lines — origami-style */}
      <path
        d="M14 36 L24 12 L34 36"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M10 34 L24 10 L38 34"
        stroke="currentColor"
        strokeWidth="0.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M18 38 L24 18 L30 38"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Diamond fold at bottom */}
      <path
        d="M20 40 L24 36 L28 40"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      {/* Stem */}
      <rect x="22" y="40" width="4" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

// ─── Kalita Wave — Flat bottom with wavy edges and 3 holes ───────────

export function KalitaIcon({ size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Kalita Wave"
    >
      {/* Trapezoid body — wider, flat bottom */}
      <path
        d="M8 6 L40 6 L36 34 L12 34 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Rim */}
      <path
        d="M4 6 L44 6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Wavy bottom edge */}
      <path
        d="M12 34 Q16 30 20 34 Q24 30 28 34 Q32 30 36 34"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Three holes at bottom */}
      <circle cx="18" cy="36" r="1.5" fill="currentColor" />
      <circle cx="24" cy="36" r="1.5" fill="currentColor" />
      <circle cx="30" cy="36" r="1.5" fill="currentColor" />
      {/* Stem */}
      <rect x="22" y="36" width="4" height="8" rx="1" fill="currentColor" />
    </svg>
  );
}

// ─── Chemex — Hourglass with wooden collar and tie ───────────────────

export function ChemexIcon({ size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Chemex"
    >
      {/* Upper bowl — wider top cone */}
      <path
        d="M6 4 L42 4 L38 20 L10 20 Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Rim */}
      <path
        d="M2 4 L46 4"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Collar — wooden band */}
      <rect x="9" y="14" width="30" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Collar tie — string wrapping */}
      <path
        d="M9 16 Q6 18 4 16"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Lower bulb */}
      <path
        d="M10 20 Q10 28 6 36 Q4 42 24 44 Q44 42 42 36 Q38 28 38 20"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinejoin="round"
      />
      {/* Fill line on bulb */}
      <path
        d="M8 32 Q14 34 24 34 Q34 34 40 32"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
        opacity="0.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ─── Aeropress — Cylinder with plunger ───────────────────────────────

export function AeropressIcon({ size = 48 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Aeropress"
    >
      {/* Main chamber cylinder */}
      <rect x="12" y="10" width="24" height="22" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Rim at top */}
      <rect x="10" y="8" width="28" height="4" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Plunger rod */}
      <line x1="24" y1="10" x2="24" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Plunger handle */}
      <rect x="18" y="2" width="12" height="3" rx="1.5" fill="currentColor" />
      {/* Plunger rubber */}
      <rect x="14" y="10" width="20" height="3" rx="1" fill="currentColor" fillOpacity="0.3" />
      {/* Bottom cap */}
      <path
        d="M12 32 Q12 36 24 36 Q36 36 36 32"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
      {/* Filter cap */}
      <circle cx="24" cy="34" r="2" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  );
}

// ─── Map: method slug → icon component ───────────────────────────────

export const methodIcons: Record<string, React.FC<IconProps>> = {
  v60: V60Icon,
  switch: SwitchIcon,
  origami: OrigamiIcon,
  kalitawave: KalitaIcon,
  chemex: ChemexIcon,
  aeropress: AeropressIcon,
};

// ─── Map: method slug → display name ─────────────────────────────────

export const methodNames: Record<string, string> = {
  v60: 'V60',
  switch: 'Hario Switch',
  origami: 'Origami',
  kalitawave: 'Kalita Wave',
  chemex: 'Chemex',
  aeropress: 'Aeropress',
};

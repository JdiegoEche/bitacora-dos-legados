import type { HTMLAttributes } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

type SkeletonRounded = 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** CSS width value (e.g. "100%", "200px", "w-full" is NOT supported — use CSS values) */
  width?: string;
  /** CSS height value (e.g. "1rem", "20px") */
  height?: string;
  /** Border-radius variant matching the project's radius scale */
  rounded?: SkeletonRounded;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Skeleton({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = '',
  ...rest
}: SkeletonProps) {
  return (
    <div
      className={`skeleton skeleton-rounded-${rounded} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
      {...rest}
    />
  );
}

import Skeleton from '../Skeleton';

/**
 * BitacoraHomeSkeleton — matches the BitacoraHome layout:
 * - Header with title + "Crear café" button
 * - 3 stat cards in a .stats-bento grid
 * - 6 bean cards in a .bean-card-grid
 */
export default function BitacoraHomeSkeleton() {
  return (
    <div>
      <div className="detail-header">
        <Skeleton width="120px" height="2rem" rounded="md" />
        <Skeleton width="120px" height="2.25rem" rounded="md" />
      </div>

      <div className="stats-bento">
        {[1, 2, 3].map((i) => (
          <div key={i} className="stat-card">
            <Skeleton width="24px" height="24px" rounded="full" />
            <Skeleton width="40px" height="1.75rem" rounded="md" />
            <Skeleton width="60px" height="0.75rem" rounded="sm" />
          </div>
        ))}
      </div>

      <div className="bean-card-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bean-card" style={{ cursor: 'default' }}>
            <Skeleton width="70%" height="1.1rem" rounded="md" />
            <div className="bean-card-meta">
              <Skeleton width="80px" height="0.85rem" rounded="sm" />
              <Skeleton width="60px" height="0.85rem" rounded="sm" />
              <Skeleton width="50px" height="0.85rem" rounded="sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

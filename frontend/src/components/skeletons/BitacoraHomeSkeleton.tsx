import Skeleton from '../Skeleton';

/**
 * BitacoraHomeSkeleton — matches the BitacoraHome layout:
 * - Header with title + "Crear café" button
 * - 6 bean cards in a .bean-card-grid
 */
export default function BitacoraHomeSkeleton() {
  return (
    <div>
      <div className="detail-header">
        <Skeleton width="120px" height="2rem" rounded="md" />
        <Skeleton width="120px" height="2.25rem" rounded="md" />
      </div>

      <div className="bean-card-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bean-card" style={{ cursor: 'default' }}>
            <Skeleton width="70%" height="1.15rem" rounded="md" />
            <div className="bean-card-meta">
              <Skeleton width="90px" height="0.85rem" rounded="sm" />
              <Skeleton width="70px" height="1.2rem" rounded="lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

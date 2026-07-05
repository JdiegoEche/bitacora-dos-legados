import Skeleton from '../Skeleton';

/**
 * BeanDetailSkeleton — matches the BeanDetail layout:
 * - Header: name + subtitle + action button
 * - Stats in a 2-column .detail-grid
 * - Brew history list with 3 skeleton items
 */
export default function BeanDetailSkeleton() {
  return (
    <div>
      <div className="detail-header">
        <div>
          <Skeleton width="200px" height="1.75rem" rounded="md" />
          <div style={{ marginTop: '0.25rem' }}>
            <Skeleton width="280px" height="0.9rem" rounded="sm" />
          </div>
        </div>
        <Skeleton width="180px" height="2.25rem" rounded="md" />
      </div>

      <div className="detail-grid">
        <div className="detail-field">
          <Skeleton width="60px" height="0.8rem" rounded="sm" />
          <Skeleton width="40px" height="1rem" rounded="sm" />
        </div>
        <div className="detail-field">
          <Skeleton width="80px" height="0.8rem" rounded="sm" />
          <Skeleton width="50px" height="1rem" rounded="sm" />
        </div>
        <div className="detail-field" style={{ gridColumn: '1 / -1' }}>
          <Skeleton width="50px" height="0.8rem" rounded="sm" />
          <div className="method-tags" style={{ marginTop: '0.25rem' }}>
            <Skeleton width="70px" height="1.5rem" rounded="sm" />
            <Skeleton width="60px" height="1.5rem" rounded="sm" />
            <Skeleton width="50px" height="1.5rem" rounded="sm" />
          </div>
        </div>
      </div>

      <div>
        <Skeleton width="200px" height="1.25rem" rounded="md" />
        <ol className="brew-history-list">
          {[1, 2, 3].map((i) => (
            <li key={i} className="brew-history-item">
              <div className="brew-history-header">
                <Skeleton width="80px" height="0.9rem" rounded="sm" />
                <Skeleton
                  width="100px"
                  height="0.85rem"
                  rounded="sm"
                  style={{ marginLeft: 'auto' }}
                />
                <Skeleton width="40px" height="0.9rem" rounded="sm" />
              </div>
              <div className="brew-history-details">
                <Skeleton width="120px" height="0.85rem" rounded="sm" />
                <Skeleton width="100px" height="0.85rem" rounded="sm" />
                <Skeleton width="80px" height="0.85rem" rounded="sm" />
                <Skeleton width="90px" height="0.85rem" rounded="sm" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

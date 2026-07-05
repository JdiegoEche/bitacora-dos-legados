import Skeleton from '../Skeleton';

/**
 * BrewDetailSkeleton — matches the BrewDetail layout:
 * - Header: title + action buttons (Edit / Delete)
 * - Param grid with 9 fields
 * - Brew notes section
 * - Tasting notes section with 2 card placeholders
 */
export default function BrewDetailSkeleton() {
  return (
    <div>
      <div className="detail-header">
        <Skeleton width="180px" height="1.75rem" rounded="md" />
        <div className="detail-actions">
          <Skeleton width="60px" height="2.25rem" rounded="md" />
          <Skeleton width="80px" height="2.25rem" rounded="md" />
        </div>
      </div>

      <div className="detail-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <div key={i} className="detail-field">
            <Skeleton width="60px" height="0.8rem" rounded="sm" />
            <Skeleton width="80px" height="1rem" rounded="sm" />
          </div>
        ))}
      </div>

      <div className="detail-notes">
        <Skeleton width="120px" height="1.1rem" rounded="md" />
        <div style={{ marginTop: '0.5rem' }}>
          <Skeleton width="100%" height="0.9rem" rounded="sm" />
          <div style={{ marginTop: '0.25rem' }}>
            <Skeleton width="80%" height="0.9rem" rounded="sm" />
          </div>
        </div>
      </div>

      <div className="notes-section">
        <Skeleton width="140px" height="1.1rem" rounded="md" />
        <div className="note-cards" style={{ marginTop: '0.75rem' }}>
          {[1, 2].map((i) => (
            <div key={i} className="note-card">
              <div className="note-attributes">
                <Skeleton width="70px" height="0.9rem" rounded="sm" />
                <Skeleton width="60px" height="0.9rem" rounded="sm" />
                <Skeleton width="80px" height="0.9rem" rounded="sm" />
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                <Skeleton width="90%" height="0.9rem" rounded="sm" />
              </div>
              <div style={{ marginTop: '0.4rem' }}>
                <Skeleton width="100px" height="0.9rem" rounded="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { PropTypes } from 'react';


export default function LibraryListingItem({ entity, onSelectEntity }) {
  const status = entity.status;

  return (
    <li
      onClick={() => {
        if (status === 'OK') {
          onSelectEntity(entity.type, entity.id);
        }
      }}
      key={entity.id}
      className={`LibraryListingItem ${entity.type} ${status}`}
    >
      {status === 'PENDING' &&
        <div className="pendingOverlay" />
      }
      <input type="checkbox" className="selectEntity disabled" />
      <div className="entityIcon"></div>
      <div className="textContents">
        <h3 className="entityName">
          {entity.name}
          {status === 'FAILED' && ' (Import failed)'}
        </h3>
        {status === 'FAILED' && <p>{entity.reason}</p>}
        {status === 'PENDING' && <p>Pending...</p>}
      </div>
      <div className="entityControls">
        <button className="showControls clickable disabled">...</button>
      </div>
    </li>
  );
}

LibraryListingItem.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string.isRequired,
    status: PropTypes.oneOf(['OK', 'FAILED', 'PENDING']),
    reason: PropTypes.string,
  }).isRequired,
  onSelectEntity: PropTypes.func.isRequired,
};

import React, { PropTypes } from 'react';


export default function LibraryListingItem({ entity, onSelectEntity }) {
  return (
    <li
      onClick={() => {
        if (entity.status === 'FAILED' || entity.status === 'PENDING') {
          return;
        }
        onSelectEntity(entity.type, entity.id);
      }}
      key={entity.id}
      className={`LibraryListingItem ${entity.type}`}
    >
      <input type="checkbox" className="selectEntity disabled" />
      <div className="entityIcon"></div>
      <div className="textContents">
        <h3 className="entityName">{entity.name}</h3>
        {entity.status === 'FAILED' ? <p>{entity.errorReason}</p> : null}
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
    status: PropTypes.oneOf(['SUCCESS', 'FAILED', 'PENDING']),
    errorReason: PropTypes.string,
  }).isRequired,
  onSelectEntity: PropTypes.func.isRequired,
};

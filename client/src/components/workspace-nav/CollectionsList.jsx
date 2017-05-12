import React, { PropTypes } from 'react';
import CollectionListItem from './CollectionListItem';

export default function CollectionsList({
  collections,
  onShowCreateCollectionModal,
  onDeleteCollection,
  pathname,
  isSelected }) {
  const listItems = collections.sort((a, b) => b.modified - a.modified).map(collection => (
    <li key={collection.id}>
      <CollectionListItem
        collection={collection}
        pathname={pathname}
        onDeleteCollection={onDeleteCollection}
      />
    </li>
  ));
  const subtitleClassName = `subtitle${isSelected ? ' selected' : ''}`;

  return (
    <div className="CollectionsList">
      <div className="subtitleRow">
        <h3 className={subtitleClassName}>
          Collections
          <button
            onClick={onShowCreateCollectionModal}
            className="addCollection clickable button"
          >
            +
          </button>
        </h3>
      </div>
      <ul>{listItems}</ul>
    </div>
  );
}

CollectionsList.propTypes = {
  collections: PropTypes.array.isRequired,
  onShowCreateCollectionModal: PropTypes.func.isRequired,
  pathname: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
  onDeleteCollection: PropTypes.func.isRequired,
};

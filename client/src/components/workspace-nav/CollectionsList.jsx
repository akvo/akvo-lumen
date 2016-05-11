import React, { PropTypes } from 'react';
import CollectionListItem from './CollectionListItem';

export default function CollectionsList({
  collections,
  onShowCreateCollectionModal,
  pathname,
  isSelected }) {
  const listItems = collections.map((collection) => (
    <li key={collection.id}>
      <CollectionListItem
        collection={collection}
        pathname={pathname}
      />
    </li>
  ));
  const subtitleClassName = `subtitle${isSelected ? ' selected' : ''}`;

  return (
    <div className="CollectionsList">
      <div className="subtitleRow">
        <h3 className={subtitleClassName}>
          Collections
          <span
            onClick={onShowCreateCollectionModal}
            className="addCollection clickable button"
          >
            +
          </span>
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
};

import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import CollectionListItem from './CollectionListItem';
import './CollectionsList.scss';

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
        key={collection.id}
        onDeleteCollection={onDeleteCollection}
      />
    </li>
  ));
  const subtitleClassName = `subtitle${isSelected ? ' selected' : ''}`;

  return (
    <div className="CollectionsList">
      <div className="subtitleRow">
        <h3 className={subtitleClassName}>
          <FormattedMessage id="collections" />
          <button
            onClick={onShowCreateCollectionModal}
            className="addCollection clickable button"
          >
            <i className="fa fa-plus-square-o" aria-hidden="true" />
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

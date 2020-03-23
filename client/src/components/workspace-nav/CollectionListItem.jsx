import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

require('./CollectionListItem.scss');

export default function CollectionListItem({ collection, onDeleteCollection, pathname }) {
  const isActive = pathname.indexOf(`${collection.id}`) > -1;
  const className = isActive ? 'selected' : null;

  return (
    <div className="CollectionListItem">
      <Link
        to={`/library/collections/${collection.id}`}
        className={className}
      >
        {collection.title}
      </Link>
      <button
        className="delete clickable"
        onClick={() => onDeleteCollection(collection)}
      >
        ✖
      </button>
    </div>
  );
}

CollectionListItem.propTypes = {
  collection: PropTypes.object,
  pathname: PropTypes.string.isRequired,
  onDeleteCollection: PropTypes.func.isRequired,
};

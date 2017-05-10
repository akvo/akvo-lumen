import React, { PropTypes } from 'react';
import { Link } from 'react-router';

export default function CollectionListItem({ collection, pathname }) {
  const isActive = pathname.indexOf(`${collection.id}`) > -1;
  const className = isActive ? 'selected' : null;

  return (
    <Link
      to={`/library/collections/${collection.id}`}
      className={className}
    >
      {collection.name}
    </Link>
  );
}

CollectionListItem.propTypes = {
  collection: PropTypes.object,
  pathname: PropTypes.string.isRequired,
};

import React, { PropTypes } from 'react';
import { Link } from 'react-router';

function slug(collection) {
  return `${collection.id}-${collection.name.toLowerCase().replace(/\s+/g, '-')}`;
}

export default function CollectionListItem({ collection, pathname }) {
  const isActive = pathname.indexOf(`${collection.id}`) > -1;
  const className = isActive ? 'selected' : null;

  return (
    <Link
      to={`/library/${slug(collection)}`}
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

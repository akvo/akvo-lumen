import React, { Component, PropTypes } from 'react';
import { Link } from 'react-router';

function slug(collection) {
  return `${collection.id}-${collection.name.toLowerCase().replace(/\s+/g, '-')}`;
}

export default class CollectionListItem extends Component {
  render() {
    const collection = this.props.collection;
    const isActive = this.props.pathname.indexOf(`${collection.id}`) > -1;
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
}

CollectionListItem.propTypes = {
  collection: PropTypes.object,
  pathname: PropTypes.string.isRequired,
};

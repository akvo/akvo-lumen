import React, { Component } from 'react';
import { Link } from 'react-router';

function slug(collection) {
  return '' + collection.id + '-' + collection.name.toLowerCase().replace(/\s+/g, '-');
}

export default class CollectionListItem extends Component {
  render() {
    const collection = this.props.collection;
    return (
      <Link to={'/library/' + slug(collection)}>
        {collection.name}
      </Link>
    );
  }
}

CollectionListItem.propTypes = {
  collection: React.PropTypes.object,
};

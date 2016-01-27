import React, { Component, PropTypes } from 'react';
import CollectionListItem from './CollectionListItem';

export default class CollectionsList extends Component {
  render() {
    const listItems = this.props.collections.map((collection) => (
        <li key={collection.id}>
          <CollectionListItem collection={collection}/>
        </li>
      )
    );
    return (
      <div className="CollectionsList">
        <h3>Collections</h3>
        <ul>{listItems}</ul>
      </div>
    );
  }
}

CollectionsList.propTypes = {
  collections: PropTypes.array.isRequired,
};

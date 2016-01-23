import React, { Component } from 'react';
import CollectionListItem from './CollectionListItem';

export default class CollectionsList extends Component {
  render() {
    const listItems = this.props.collections.map(collection => {
      return (
        <li key={collection.id}>
          <CollectionListItem collection={collection}/>
        </li>
      );
    });

    return <ul>{listItems}</ul>;
  }
}

CollectionsList.propTypes = {
  collections: React.PropTypes.array.isRequired,
};

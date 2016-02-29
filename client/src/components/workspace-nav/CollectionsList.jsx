import React, { Component, PropTypes } from 'react';
import CollectionListItem from './CollectionListItem';

export default class CollectionsList extends Component {
  render() {
    const listItems = this.props.collections.map((collection) => (
        <li key={collection.id}>
          <CollectionListItem
            collection={collection}
            pathname={this.props.pathname}
          />
        </li>
      )
    );
    const subtitleClassName = `subtitle${this.props.isSelected ? ' selected' : ''}`;

    return (
      <div className="CollectionsList">
        <div className="subtitleRow">
          <h3 className={subtitleClassName}>
            Collections
            <span
              onClick={this.props.onShowCreateCollectionModal}
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
}

CollectionsList.propTypes = {
  collections: PropTypes.array.isRequired,
  onShowCreateCollectionModal: PropTypes.func.isRequired,
  pathname: PropTypes.string.isRequired,
  isSelected: PropTypes.bool,
};

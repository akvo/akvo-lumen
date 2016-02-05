import React, { Component, PropTypes } from 'react';

export default class LibraryListingItem extends Component {

  render() {
    const { entity } = this.props;
    return (
      <li
        onClick={() => this.props.onSelectEntity(entity.type, entity.id)}
        key={entity.id} className="LibraryListingItem">
        <input type="checkbox" />
        {entity.name}
        <button>...</button>
      </li>
    );
  }
}

LibraryListingItem.propTypes = {
  entity: PropTypes.object.isRequired,
  onSelectEntity: PropTypes.func.isRequired,
};

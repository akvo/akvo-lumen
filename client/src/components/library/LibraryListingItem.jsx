import React, { Component, PropTypes } from 'react';

export default class LibraryListingItem extends Component {
  render() {
    return (
      <li key={this.props.entity.id} className="LibraryListingItem">
        <input type="checkbox" />
        {this.props.entity.name}
        <button>...</button>
      </li>
    );
  }
}

LibraryListingItem.propTypes = {
  entity: PropTypes.object.isRequired,
};

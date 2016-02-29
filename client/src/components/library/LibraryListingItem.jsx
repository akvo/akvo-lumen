import React, { Component, PropTypes } from 'react';

export default class LibraryListingItem extends Component {

  render() {
    const { entity } = this.props;
    return (
      <li
        onClick={() => this.props.onSelectEntity(entity.type, entity.id)}
        key={entity.id}
        className={`LibraryListingItem ${entity.type}`}
      >
        <input type="checkbox" className="selectEntity disabled" />
        <div className="entityIcon"></div>
        <div className="textContents">
          <h3 className="entityName">{entity.name}</h3>
        </div>
        <div className="entityControls">
          <button className="showControls clickable disabled">...</button>
        </div>
      </li>
    );
  }
}

LibraryListingItem.propTypes = {
  entity: PropTypes.object.isRequired,
  onSelectEntity: PropTypes.func.isRequired,
};

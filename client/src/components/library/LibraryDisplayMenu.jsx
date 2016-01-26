import React, { Component, PropTypes } from 'react';

export default class LibraryDisplayMenu extends Component {
  render() {
    const { sortOrder, onChangeSortOrder, displayMode, onChangeDisplayMode } = this.props;
    return (
      <div className="LibraryDisplayMenu">
        <select
          value={sortOrder}
          onChange={evt => onChangeSortOrder(evt.target.value)}>
          <option value="last_modified">Last Modified</option>
          <option value="created">Created</option>
          <option value="name">Name</option>
        </select>
        <select
          value={displayMode}
          onChange={evt => onChangeDisplayMode(evt.target.value)}>
          <option value="grid">Grid</option>
          <option value="list">List</option>
        </select>
      </div>
    );
  }
}

LibraryDisplayMenu.propTypes = {
  sortOrder: PropTypes.oneOf(['last_modified', 'created', 'name']).isRequired,
  onChangeSortOrder: PropTypes.func,
  displayMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  onChangeDisplayMode: PropTypes.func,
};

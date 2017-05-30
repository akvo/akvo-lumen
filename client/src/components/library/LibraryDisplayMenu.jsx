import React, { PropTypes } from 'react';
import SelectMenu from '../common/SelectMenu';

export default function LibraryDisplayMenu(props) {
  const { sortOrder, onChangeSortOrder, onChangeDisplayMode } = props;
  const sortOptions = [
    { value: 'last_modified', label: 'Last modified' },
    { value: 'created', label: 'Created' },
    { value: 'name', label: 'Name' },
  ];
  return (
    <div className="LibraryDisplayMenu">
      <label
        className="sortOrderLabel"
        htmlFor="sort-order"
      >
        Sort by:
      </label>
      <SelectMenu
        name="sort-order"
        options={sortOptions}
        onChange={value => onChangeSortOrder(value)}
        value={sortOrder}
      />
      <div className="displayControls">
        <div
          className="clickable displayGrid control"
          onClick={() => onChangeDisplayMode('grid')}
        >
          <i className="fa fa-th-large" aria-hidden="true" />
        </div>
        <div
          className="clickable displayList control"
          onClick={() => onChangeDisplayMode('list')}
        >
          <i className="fa fa-th-list" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

LibraryDisplayMenu.propTypes = {
  sortOrder: PropTypes.oneOf(['last_modified', 'created', 'name']).isRequired,
  onChangeSortOrder: PropTypes.func.isRequired,
  isReverseSort: PropTypes.bool.isRequired,
  onChangeReverseSort: PropTypes.func.isRequired,
  displayMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  onChangeDisplayMode: PropTypes.func.isRequired,
};

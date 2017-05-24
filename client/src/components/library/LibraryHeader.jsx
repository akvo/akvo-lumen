import React, { PropTypes } from 'react';

import LocationIndicator from './LocationIndicator';
import LibraryCreateButton from './LibraryCreateButton';
import LibrarySearch from './LibrarySearch';
import LibraryTabList from './LibraryTabList';
import LibraryDisplayMenu from './LibraryDisplayMenu';

require('./LibraryHeader.scss');

export default function LibraryHeader(props) {
  return (
    <div className="LibraryHeader">
      <div className="row rowPrimary">
        <LocationIndicator
          pathname={props.pathname}
        />
        <LibraryCreateButton
          onCreate={props.onCreate}
        />
        <LibrarySearch
          searchString={props.searchString}
          onSearch={props.onSetSearchString}
        />
      </div>
      <div className="row rowSecondary">
        <LibraryTabList
          selected={props.filterBy}
          onSelect={props.onChangeFilterBy}
        />
        <LibraryDisplayMenu
          sortOrder={props.sortOrder}
          onChangeSortOrder={props.onChangeSortOrder}
          isReverseSort={props.isReverseSort}
          onChangeReverseSort={props.onChangeReverseSort}
          displayMode={props.displayMode}
          onChangeDisplayMode={props.onChangeDisplayMode}
        />
      </div>
    </div>
  );
}

LibraryHeader.propTypes = {
  displayMode: PropTypes.string.isRequired,
  onChangeDisplayMode: PropTypes.func.isRequired,
  sortOrder: PropTypes.string.isRequired,
  onChangeSortOrder: PropTypes.func.isRequired,
  isReverseSort: PropTypes.bool.isRequired,
  onChangeReverseSort: PropTypes.func.isRequired,
  filterBy: PropTypes.string.isRequired,
  onChangeFilterBy: PropTypes.func.isRequired,
  searchString: PropTypes.string,
  onSetSearchString: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  pathname: PropTypes.string.isRequired,
};

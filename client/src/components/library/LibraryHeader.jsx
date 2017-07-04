import React from 'react';
import PropTypes from 'prop-types';
import LocationIndicator from './LocationIndicator';
import LibraryCreateButton from './LibraryCreateButton';
import LibrarySearch from './LibrarySearch';
import LibraryTabList from './LibraryTabList';

require('./LibraryHeader.scss');

export default function LibraryHeader(props) {
  return (
    <div className="LibraryHeader">
      <div className="row rowPrimary">
        <LocationIndicator
          location={props.location}
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
  location: PropTypes.string.isRequired,
};

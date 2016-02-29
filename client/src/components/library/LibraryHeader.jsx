import React, { Component, PropTypes } from 'react';

import LocationIndicator from './LocationIndicator';
import LibraryCreateButton from './LibraryCreateButton';
import LibrarySearch from './LibrarySearch';
import LibraryTabList from './LibraryTabList';
import LibraryDisplayMenu from './LibraryDisplayMenu';

require('../../styles/LibraryHeader.scss');

export default class LibraryHeader extends Component {
  render() {
    return (
      <div className="LibraryHeader">
        <div className="row rowPrimary">
          <LocationIndicator
            pathname={this.props.pathname}
          />
          <LibraryCreateButton
            onCreate={this.props.onCreate} />
          <LibrarySearch
            searchString={this.props.searchString}
            onSearch={this.props.onSetSearchString} />
        </div>
        <div className="row rowSecondary">
          <LibraryTabList
            selected={this.props.filterBy}
            onSelect={this.props.onChangeFilterBy} />
          <LibraryDisplayMenu
            sortOrder={this.props.sortOrder}
            onChangeSortOrder={this.props.onChangeSortOrder}
            isReverseSort={this.props.isReverseSort}
            onChangeReverseSort={this.props.onChangeReverseSort}
            displayMode={this.props.displayMode}
            onChangeDisplayMode={this.props.onChangeDisplayMode} />
        </div>
      </div>
    );
  }
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
  pathname: PropTypes.string,
};

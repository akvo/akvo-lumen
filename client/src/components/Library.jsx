import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import LibraryHeader from './library/LibraryHeader';
import LibraryListing from './library/LibraryListing';
import * as libraryActions from '../actions/library';

class Library extends Component {
  render() {
    const { displayMode, sortOrder, filterBy, searchString, actions } = this.props;
    return (
      <div>
        <LibraryHeader
          displayMode={displayMode}
          onChangeDisplayMode={actions.changeDisplayMode}
          sortOrder={sortOrder}
          onChangeSortOrder={actions.changeSortOrder}
          filterBy={filterBy}
          onChangeFilterBy={actions.changeFilterBy}
          onSetSearchString={actions.setSearchString}/>
        <LibraryListing
          displayMode={displayMode}
          sortOrder={sortOrder}
          filterBy={filterBy}
          searchString={searchString}/>
      </div>
    );
  }
}

Library.propTypes = {
  displayMode: PropTypes.string.isRequired,
  sortOrder: PropTypes.string.isRequired,
  filterBy: PropTypes.string.isRequired,
  searchString: PropTypes.string.isRequired,
  actions: PropTypes.objectOf(PropTypes.func),
};

export default connect(
  (state) => {
    return state.library;
  },
  (dispatch) => {
    return { actions: bindActionCreators(libraryActions, dispatch) };
  }
 )(Library);

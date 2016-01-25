import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, dispatch } from 'redux';
import { routeActions } from 'react-router-redux';
import LibraryHeader from './library/LibraryHeader';
import LibraryListing from './library/LibraryListing';
import * as libraryActions from '../actions/library';

function mergeQuery(location, query) {
  return Object.assign({}, location, {
    query: Object.assign({}, location.query, query)
  });
}

function updateQueryAction(location, query) {
  return routeActions.push(mergeQuery(location, query));
}

class Library extends Component {
  render() {
    const { dispatch, location, params } = this.props;
    const query = location.query;
    const displayMode = query.display || "list";
    const sortOrder = query.sort || "last_modified";
    const filterBy = query.filter || "all";
    const searchString = query.search || "";
    const collection = params.collection || null;
    return (
      <div>
        <LibraryHeader
          displayMode={displayMode}
          onChangeDisplayMode={(newDisplayMode) => {
            dispatch(updateQueryAction(location, {
              display: newDisplayMode
            }))
          }}
          sortOrder={sortOrder}
          onChangeSortOrder={(newSortOrder) => {
            dispatch(updateQueryAction(location, {
              sort: newSortOrder
            }))
          }}
          filterBy={filterBy}
          onChangeFilterBy={(newFilterBy) => {
            dispatch(updateQueryAction(location, {
              filter: newFilterBy
            }))
          }}
          onSetSearchString={(newSearchString) => {
            const search = newSearchString.trim();
            if (newSearchString !== '') {
              dispatch(updateQueryAction(location, {
                search: newSearchString
              }))
            }
          }}/>
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
};

export default connect(
  (state) => {
    return state.library;
  })(Library);

import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import LibraryListingGroup from './LibraryListingGroup';
import * as entity from '../../domain/entity';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorScreen from '../../components/common/ErrorScreen';

require('./LibraryListing.scss');

const mapEntityObjectsToArray = (...objects) => {
  // Convert one or more entity objects into an array of entities
  const output = [];
  objects.forEach((entityObject) => {
    Object.keys(entityObject).forEach((key) => {
      const ent = entityObject[key];
      output.push(ent);
    });
  });
  return output;
};

const filterEntities = (library, filterBy, searchString) => {
  let unsearchedEntities = [];
  let searchedEntities = [];
  if (filterBy === 'all') {
    unsearchedEntities = mapEntityObjectsToArray(library.datasets,
      library.visualisations, library.dashboards, library.rasters);
  } else {
    unsearchedEntities = mapEntityObjectsToArray(library[filterBy]);
  }
  if (searchString === '') {
    searchedEntities = unsearchedEntities;
  } else {
    // Basic, proof-of-concept string matching for search function
    unsearchedEntities.forEach((ent) => {
      const entityTitle = entity.getTitle(ent);
      if (entityTitle.toLowerCase().indexOf(searchString.toLowerCase()) > -1) {
        searchedEntities.push(ent);
      }
    });
  }

  return searchedEntities;
};

const groupEntities = (entities, sortOrder) => {
  const listGroups = {};

  if (sortOrder === 'name') {
    entities.forEach((ent) => {
      const entityTitle = entity.getTitle(ent);
      const key = entityTitle.toLowerCase().charAt(0);

      listGroups[key] = listGroups[key] || { listGroupName: key, entities: [] };
      listGroups[key].entities.push(ent);
    });
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    entities.forEach((ent) => {
      let entityDate = sortOrder === 'created' ?
        entity.getCreatedTimestamp(ent) : entity.getModifiedTimestamp(ent);
      entityDate = new Date(parseInt(entityDate, 10));

      // Take the year, month and day as the key
      const key = moment(entityDate).format('YYYY-MM-DD');

      listGroups[key] = listGroups[key] || { listGroupName: key, entities: [] };
      listGroups[key].entities.push(ent);
    });
  }

  return listGroups;
};

// Accepts an object containing list groups, and returns a sorted array of list groups
const sortGroups = (listGroups, sortOrder, isReverseSort) => {
  const listGroupArray = [];

  // Convert the listGroup objects into an unsorted listGroup array
  Object.keys(listGroups).forEach((key) => {
    listGroupArray.push(listGroups[key]);
  });

  const sortFunction = (a, b) => {
    let out;

    if (isReverseSort) {
      out = new Date(a.listGroupName) - new Date(b.listGroupName);
    } else {
      out = new Date(b.listGroupName) - new Date(a.listGroupName);
    }

    return out;
  };

  return listGroupArray.sort(sortFunction);
};

export default function LibraryListing({
  library,
  filterBy,
  sortOrder,
  isReverseSort,
  collections,
  currentCollection,
  displayMode,
  searchString,
  checkboxEntities,
  onCheckEntity,
  onEntityAction,
}) {
  if (!library.meta.hasFetched) {
    return (
      <div className={`LibraryListing ${displayMode}`}>
        <LoadingSpinner />
      </div>
    );
  }

  const entities = filterEntities(library, filterBy, searchString);
  const listGroups = groupEntities(entities, sortOrder);
  const sortedListGroups = sortGroups(listGroups, sortOrder, isReverseSort);
  const results = sortedListGroups.length > 0;

  return (
    <div className={`LibraryListing ${displayMode} ${!results ? 'LibraryListing--empty' : ''}`}>
      {(!results && !currentCollection && !searchString) && (
        <ErrorScreen
          code="Welcome"
          title="Get started by adding datasets, visualisations and dashboards to your library from the top menu." 
        />
      )}
      
      {(!results && currentCollection && !searchString) && (
        <ErrorScreen
          code="Empty"
          title="There are no items in this collection." 
        />
      )}

      {(!results && searchString) && (
        <ErrorScreen
          code="No Results"
          title="Please update your search and try again." 
        />
      )}

      {results && (
        <ul>
          {sortedListGroups.map((listGroup, index) =>
            <LibraryListingGroup
              key={index}
              listGroup={listGroup}
              collections={collections}
              currentCollection={currentCollection}
              displayMode={displayMode}
              sortOrder={sortOrder}
              isReverseSort={isReverseSort}
              checkboxEntities={checkboxEntities}
              onCheckEntity={onCheckEntity}
              onEntityAction={onEntityAction}
            />
          )}
        </ul>
      )}
    </div>
  );
}

LibraryListing.propTypes = {
  library: PropTypes.object.isRequired,
  filterBy: PropTypes.oneOf(['all', 'datasets', 'visualisations', 'dashboards', 'rasters']).isRequired,
  sortOrder: PropTypes.oneOf(['created', 'last_modified', 'name']).isRequired,
  isReverseSort: PropTypes.bool.isRequired,
  displayMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  searchString: PropTypes.string.isRequired,
  onEntityAction: PropTypes.func.isRequired,
  collections: PropTypes.object.isRequired,
  currentCollection: PropTypes.object,
  checkboxEntities: PropTypes.array.isRequired,
  onCheckEntity: PropTypes.func.isRequired,
};

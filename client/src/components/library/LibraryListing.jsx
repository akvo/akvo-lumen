import React, { PropTypes } from 'react';
import moment from 'moment';
import LibraryListingGroup from './LibraryListingGroup';
import * as entity from '../../domain/entity';

require('../../styles/LibraryListing.scss');

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
      library.visualisations, library.dashboards);
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
  let sortFunction;

  // Convert the listGroup objects into an unsorted listGroup array
  Object.keys(listGroups).forEach((key) => {
    listGroupArray.push(listGroups[key]);
  });

  // Prepare the appropriate sort function based on sortOrder
  if (sortOrder === 'name') {
    sortFunction = (a, b) => {
      const string1 = a.listGroupName.toLowerCase();
      const string2 = b.listGroupName.toLowerCase();
      let out;

      if (string1 > string2) {
        out = 1;
      } else if (string1 === string2) {
        out = 0;
      } else {
        out = -1;
      }

      if (isReverseSort) out *= -1;
      return out;
    };
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    sortFunction = (a, b) => {
      let out;

      if (isReverseSort) {
        out = new Date(a.listGroupName) - new Date(b.listGroupName);
      } else {
        out = new Date(b.listGroupName) - new Date(a.listGroupName);
      }

      return out;
    };
  }

  return listGroupArray.sort(sortFunction);
};

export default function LibraryListing({
  library,
  filterBy,
  sortOrder,
  isReverseSort,
  displayMode,
  searchString,
  onSelectEntity,
  onEntityAction }) {
  const entities = filterEntities(library, filterBy,
    searchString);
  const listGroups = groupEntities(entities, sortOrder);
  const sortedListGroups = sortGroups(listGroups, sortOrder, isReverseSort);
  return (
    <div className={`LibraryListing ${displayMode}`}>
      <ul>
        {sortedListGroups.map((listGroup, index) =>
          <LibraryListingGroup
            key={index}
            listGroup={listGroup}
            displayMode={displayMode}
            sortOrder={sortOrder}
            isReverseSort={isReverseSort}
            onSelectEntity={onSelectEntity}
            onEntityAction={onEntityAction}
          />
        )}
      </ul>
    </div>
  );
}

LibraryListing.propTypes = {
  library: PropTypes.object.isRequired,
  filterBy: PropTypes.oneOf(['all', 'datasets', 'visualisations', 'dashboards']).isRequired,
  sortOrder: PropTypes.oneOf(['created', 'last_modified', 'name']).isRequired,
  isReverseSort: PropTypes.bool.isRequired,
  displayMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  searchString: PropTypes.string.isRequired,
  onSelectEntity: PropTypes.func.isRequired,
  onEntityAction: PropTypes.func.isRequired,
};

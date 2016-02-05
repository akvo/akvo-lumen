import React, { Component, PropTypes } from 'react';
import LibraryListingGroup from './LibraryListingGroup';

require('../../styles/LibraryListing.scss');

const mapEntityObjectsToArray = (...objects) => {
  // Convert one or more entity objects into an array of entities
  const output = [];
  objects.map((entityObject) => {
    Object.keys(entityObject).map(key => {
      const entity = entityObject[key];
      output.push(entity);
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
    unsearchedEntities.map(entity => {
      if (entity.name.toLowerCase().indexOf(searchString.toLowerCase()) > -1) {
        searchedEntities.push(entity);
      }
    });
  }

  return searchedEntities;
};

const groupEntities = (entities, sortOrder) => {
  const listGroups = {};

  if (sortOrder === 'name') {
    entities.map(entity => {
      const key = entity.name.toLowerCase().charAt(0);

      listGroups[key] = listGroups[key] || { listGroupName: key, entities: [] };
      listGroups[key].entities.push(entity);
    });
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    entities.map(entity => {
      let entityDate = sortOrder === 'created' ? entity.created : entity.modified || entity.created;
      entityDate = new Date(parseInt(entityDate, 10));

      // Take the year, month and day as the key
      const key = `${entityDate.getUTCFullYear()}-` +
        `${entityDate.getUTCMonth() + 1}-` +
        `${entityDate.getUTCDate()}`;

      listGroups[key] = listGroups[key] || { listGroupName: key, entities: [] };
      listGroups[key].entities.push(entity);
    });
  }

  return listGroups;
};

// Accepts an object containing list groups, and returns a sorted array of list groups
const sortGroups = (listGroups, sortOrder, isReverseSort) => {
  const listGroupArray = [];

  // Convert the listGroup objects into an unsorted listGroup array
  Object.keys(listGroups).map(key => {
    listGroupArray.push(listGroups[key]);
  });

  // Prepare the appropriate sort function based on sortOrder
  if (sortOrder === 'name') {
    listGroupArray.sort();
    if (isReverseSort) listGroupArray.reverse();
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    const sortFunction = (a, b) => {
      let output;
      if (isReverseSort) {
        output = new Date(a.listGroupName) - new Date(b.listGroupName);
      } else {
        output = new Date(b.listGroupName) - new Date(a.listGroupName);
      }

      return output;
    };
    listGroupArray.sort(sortFunction);
  }

  return listGroupArray;
};

export default class LibraryListing extends Component {

  render() {
    const entities = filterEntities(this.props.library, this.props.filterBy,
      this.props.searchString);
    const listGroups = groupEntities(entities, this.props.sortOrder);
    const sortedListGroups = sortGroups(listGroups, this.props.sortOrder, this.props.isReverseSort);

    return (
      <div className={`LibraryListing ${this.props.displayMode}`}>
        <ul>
          {sortedListGroups.map((listGroup, index) =>
            <LibraryListingGroup
              key={index}
              listGroup={listGroup}
              displayMode={this.props.displayMode}
              sortOrder={this.props.sortOrder}
              isReverseSort={this.props.isReverseSort}
              onSelectEntity={this.props.onSelectEntity}
            />
          )}
        </ul>
      </div>
    );
  }
}

LibraryListing.propTypes = {
  library: PropTypes.object.isRequired,
  filterBy: PropTypes.oneOf(['all', 'datasets', 'visualisations', 'dashboards']).isRequired,
  sortOrder: PropTypes.oneOf(['created', 'last_modified', 'name']).isRequired,
  isReverseSort: PropTypes.bool.isRequired,
  displayMode: PropTypes.oneOf(['grid', 'list']).isRequired,
  searchString: PropTypes.string.isRequired,
  onSelectEntity: PropTypes.func.isRequired,
};

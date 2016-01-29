import React, { Component, PropTypes } from 'react';
import LibraryListingGroup from './LibraryListingGroup';

require('../../styles/LibraryListing.scss');

export default class LibraryListing extends Component {
  mapEntityObjectsToArray(...objects) {
    // Convert one or more entity objects to an array of entities
    const output = [];
    objects.map((entityObject) => {
      Object.keys(entityObject).map(key => {
        const entity = entityObject[key];
        output.push(entity);
      });
    });
    return output;
  }
  render() {
    const { datasets, visualisations, dashboards } = this.props.library;
    const isSortDateType = this.props.sortOrder === 'created' ||
            this.props.sortOrder === 'last_modified';
    let entities = [];
    const listGroups = {};
    const listGroupsArray = [];
    if (this.props.filterBy === 'all') {
      entities = this.mapEntityObjectsToArray(datasets, visualisations, dashboards);
    } else {
      entities = this.mapEntityObjectsToArray(this.props.library[this.props.filterBy]);
    }

    // Separate entities into ListGroups by sortOrder

    if (this.props.sortOrder === 'name') {
      // All entities in one ListGroup
      listGroups.sortByName = {};
      listGroups.sortByName.entities = entities;
    } else if (isSortDateType) {
      entities.map(entity => {
        let entityDate;

        if (this.props.sortOrder === 'created') {
          entityDate = entity.created;
        } else {
          entityDate = entity.modified || entity.created;
        }

        const sd = new Date(parseInt(entityDate, 10));

        // Take the year, month and day as the key
        const key = `${sd.getUTCFullYear()}-${sd.getUTCMonth() + 1}-${sd.getUTCDate()}`;

        // If the propety for this day doesn't exist yet, create it
        listGroups[key] = listGroups[key] || { listGroupDate: key, entities: [] };
        listGroups[key].entities.push(entity);
      });
    }

    // Sort entities by sortOrder

    const sortListGroupBySortOrder = (a, b) => {
      let output;
      let dateA = a.created;
      let dateB = b.created;

      if (this.props.sortOrder === 'last_modified') {
        dateA = a.modified || dateA;
        dateB = b.modified || dateB;
      }

      if (this.props.reverseSort) {
        output = new Date(a.created) - new Date(b.created);
      } else {
        output = new Date(b.created) - new Date(a.created);
      }
      return output;
    };

    if (isSortDateType) {
      Object.keys(listGroups).map(key => {
        const listGroup = listGroups[key].entities;
        listGroup.sort(sortListGroupBySortOrder);
      });
    } else if (this.props.sortOrder === 'name') {
      listGroups.sortByName.entities.sort((a, b) => {
        const sortA = a.name.toLowerCase();
        const sortB = b.name.toLowerCase();

        const compare = this.props.reverseSort ? sortA < sortB : sortB < sortA;
        const output = compare ? 1 : -1;

        return output;
      });
    }

    // Push the each listGroup to an array, then sort that array

    Object.keys(listGroups).map(key => {
      listGroupsArray.push(listGroups[key]);
    });

    if (isSortDateType) {
      listGroupsArray.sort((a, b) => {
        let output;

        const sortA = new Date(Date.parse(a.listGroupDate)).getTime();
        const sortB = new Date(Date.parse(b.listGroupDate)).getTime();

        if (this.props.reverseSort) {
          output = sortA - sortB;
        } else {
          output = sortB - sortA;
        }

        return output;
      });
    }

    return (
      <div className={`LibraryListing ${this.props.displayMode}`}>
        <ul>
          {listGroupsArray.map((listGroup, index) =>
            <LibraryListingGroup
              key={index}
              listGroup={listGroup}
              displayMode={this.props.displayMode}
              isSortDateType={isSortDateType}
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
  reverseSort: PropTypes.bool.isRequired,
  displayMode: PropTypes.oneOf(['grid', 'list']).isRequired,
};

import React, { Component, PropTypes } from 'react';
import LibraryListingItem from './LibraryListingItem';

const getListGroupTitle = (listGroupName, sortOrder) => {
  let title;

  if (sortOrder === 'name') {
    title = listGroupName.toUpperCase();
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    // TODO: format this
    title = new Date(Date.parse(listGroupName)).toUTCString();
  }
  return title;
};

const sortListGroupEntities = (entities, sortOrder, isReverseSort) => {
  const sortedEntities = [];
  let sortFunction;

  entities.map(entity => sortedEntities.push(entity));

  if (sortOrder === 'name') {
    sortFunction = (a, b) => {
      let output = a.name > b.name ? 1 : -1;
      if (isReverseSort) output = output * -1;
      return output;
    };
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    sortFunction = (a, b) => {
      const key = sortOrder === 'created' ? 'created' : 'modified';
      const dateA = new Date(a[key]) || new Date(a.created);
      const dateB = new Date(b[key]) || new Date(b.created);
      let output = dateA - dateB;

      if (isReverseSort) output = output * -1;

      return output;
    };
  }

  sortedEntities.sort(sortFunction);

  return sortedEntities;
};

export default class LibraryListingGroup extends Component {
  render() {
    const listGroupTitle = getListGroupTitle(this.props.listGroup.listGroupName,
      this.props.sortOrder);
    const sortedEntities = sortListGroupEntities(this.props.listGroup.entities,
      this.props.sortOrder, this.props.isReverseSort);

    return (
      <div className="LibraryListingGroup">
        <h3>{listGroupTitle}</h3>
        <ol>
          {sortedEntities.map((entity, index) =>
            <LibraryListingItem
              key={index}
              entity={entity}
              displayMode={this.props.displayMode}
              onSelectEntity={this.props.onSelectEntity}
            />
          )}
        </ol>
      </div>
    );
  }
}

LibraryListingGroup.propTypes = {
  listGroup: PropTypes.shape({
    listGroupName: PropTypes.string.isRequired,
    entities: PropTypes.array,
  }),
  displayMode: PropTypes.oneOf(['list', 'grid']).isRequired,
  sortOrder: PropTypes.oneOf(['created', 'last_modified', 'name']).isRequired,
  isReverseSort: PropTypes.bool.isRequired,
};

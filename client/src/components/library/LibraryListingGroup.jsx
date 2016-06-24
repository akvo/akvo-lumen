import React, { PropTypes } from 'react';
import moment from 'moment';
import LibraryListingItem from './LibraryListingItem';

const getListGroupTitle = (listGroupName, sortOrder) => {
  switch (sortOrder) {
    case 'name':
      return listGroupName.toUpperCase();
    case 'created':
    case 'last_modified':
      return moment(listGroupName, 'YYYY-MM-DD').format('MMMM Do YYYY');
    default:
      throw new Error(`Invalid sort order ${sortOrder}`);
  }
};

const sortListGroupEntities = (entities, sortOrder, isReverseSort) => {
  const sortedEntities = [];
  let sortFunction;

  entities.map(entity => sortedEntities.push(entity));

  if (sortOrder === 'name') {
    sortFunction = (a, b) => {
      let out;

      if (a.name > b.name) {
        out = 1;
      } else if (a.name === b.name) {
        out = 0;
      } else {
        out = -1;
      }

      if (isReverseSort) out = out * -1;
      return out;
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

/* Temporary shim until we standardize on either "name" or "title" for entities */
const convertEntity = entity => {
  const output = Object.assign({}, entity);

  if (output.title && !output.name) {
    output.name = output.title;
    delete output.title;
  }

  return output;
};

export default function LibraryListingGroup({
  listGroup, displayMode, sortOrder, isReverseSort, onSelectEntity, onEntityAction }) {
  const listGroupTitle = getListGroupTitle(listGroup.listGroupName, sortOrder);
  const sortedEntities = sortListGroupEntities(listGroup.entities, sortOrder, isReverseSort);

  return (
    <div className="LibraryListingGroup">
      <h3>{listGroupTitle}</h3>
      <ol>
        {sortedEntities.map((entity, index) =>
          <LibraryListingItem
            key={index}
            entity={convertEntity(entity)}
            displayMode={displayMode}
            onSelectEntity={onSelectEntity}
            onEntityAction={onEntityAction}
          />
        )}
      </ol>
    </div>
  );
}

LibraryListingGroup.propTypes = {
  listGroup: PropTypes.shape({
    listGroupName: PropTypes.string.isRequired,
    entities: PropTypes.array,
  }),
  displayMode: PropTypes.oneOf(['list', 'grid']).isRequired,
  sortOrder: PropTypes.oneOf(['created', 'last_modified', 'name']).isRequired,
  isReverseSort: PropTypes.bool.isRequired,
  onSelectEntity: PropTypes.func.isRequired,
  onEntityAction: PropTypes.func.isRequired,
};

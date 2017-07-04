import React from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';
import LibraryListingItem from './LibraryListingItem';
import { getTitle, getId, getCreatedTimestamp, getModifiedTimestamp } from '../../domain/entity';

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
      const n = getTitle(a).localeCompare(getTitle(b));
      return isReverseSort ? n * -1 : n;
    };
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    const getTs = sortOrder === 'created' ? getCreatedTimestamp : getModifiedTimestamp;
    sortFunction = (a, b) => {
      const n = getTs(b) - getTs(a);
      return isReverseSort ? n * -1 : n;
    };
  }

  sortedEntities.sort(sortFunction);
  return sortedEntities;
};

const isEntityChecked = (entity, checkboxEntities = []) =>
  checkboxEntities.indexOf(getId(entity)) > -1;

export default function LibraryListingGroup({
  listGroup,
  displayMode,
  collections,
  currentCollection,
  sortOrder,
  isReverseSort,
  checkboxEntities,
  onCheckEntity,
  onEntityAction }) {
  const listGroupTitle = getListGroupTitle(listGroup.listGroupName, sortOrder);
  const sortedEntities = sortListGroupEntities(listGroup.entities, sortOrder, isReverseSort);

  return (
    <div className="LibraryListingGroup">
      <h3>{listGroupTitle}</h3>
      <ol>
        {sortedEntities.map((entity, index) =>
          <LibraryListingItem
            key={index}
            entity={entity}
            isChecked={isEntityChecked(entity, checkboxEntities)}
            displayMode={displayMode}
            collections={collections}
            currentCollection={currentCollection}
            onCheckEntity={onCheckEntity}
            onEntityAction={onEntityAction}
            showCheckbox={checkboxEntities.length > 0}
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
  onEntityAction: PropTypes.func.isRequired,
  collections: PropTypes.object.isRequired,
  currentCollection: PropTypes.object,
  checkboxEntities: PropTypes.array.isRequired,
  onCheckEntity: PropTypes.func.isRequired,
};

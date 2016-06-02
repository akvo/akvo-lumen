import React, { PropTypes } from 'react';
import LibraryListingItem from './LibraryListingItem';

const getListGroupTitle = (listGroupName, sortOrder) => {
  let title;

  if (sortOrder === 'name') {
    title = listGroupName.toUpperCase();
  } else if (sortOrder === 'created' || sortOrder === 'last_modified') {
    const date = new Date(Date.parse(listGroupName));
    const locale = 'en-us';
    const month = date.toLocaleString(locale, { month: 'long' });
    title = `${date.getDate()} ${month} ${date.getFullYear()}`;
  }

  return title;
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

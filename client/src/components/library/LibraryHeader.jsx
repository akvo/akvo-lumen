import React, { PropTypes } from 'react';

import LocationIndicator from './LocationIndicator';
import LibraryCreateButton from './LibraryCreateButton';
import LibrarySearch from './LibrarySearch';
import LibraryTabList from './LibraryTabList';
import LibraryDisplayMenu from './LibraryDisplayMenu';
import CheckboxEntityMenu from './CheckboxEntityMenu';

require('../../styles/LibraryHeader.scss');

export default function LibraryHeader(props) {
  return (
    <div className="LibraryHeader">
      <div className="row rowPrimary">
        <LocationIndicator
          location={props.location}
        />
        <LibraryCreateButton
          onCreate={props.onCreate}
        />
        <LibrarySearch
          searchString={props.searchString}
          onSearch={props.onSetSearchString}
        />
      </div>
      <div>
        {props.checkboxEntities.length >= 1 ?
          <CheckboxEntityMenu
            collections={props.collections}
            collection={props.collection}
            onCreateCollection={props.onCreateCollection}
            onAddEntitiesToCollection={props.onAddEntitiesToCollection}
            onRemoveEntitiesFromCollection={props.onRemoveEntitiesFromCollection}
            checkboxEntities={props.checkboxEntities}
            onDeselectEntities={props.onDeselectEntities}
          />
          :
          <div className="row rowSecondary">
            <LibraryTabList
              selected={props.filterBy}
              onSelect={props.onChangeFilterBy}
            />
            <LibraryDisplayMenu
              sortOrder={props.sortOrder}
              onChangeSortOrder={props.onChangeSortOrder}
              isReverseSort={props.isReverseSort}
              onChangeReverseSort={props.onChangeReverseSort}
              displayMode={props.displayMode}
              onChangeDisplayMode={props.onChangeDisplayMode}
            />
          </div>
        }
      </div>
    </div>
  );
}

LibraryHeader.propTypes = {
  displayMode: PropTypes.string.isRequired,
  onChangeDisplayMode: PropTypes.func.isRequired,
  sortOrder: PropTypes.string.isRequired,
  onChangeSortOrder: PropTypes.func.isRequired,
  isReverseSort: PropTypes.bool.isRequired,
  onChangeReverseSort: PropTypes.func.isRequired,
  filterBy: PropTypes.string.isRequired,
  onChangeFilterBy: PropTypes.func.isRequired,
  searchString: PropTypes.string,
  onSetSearchString: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  location: PropTypes.string.isRequired,
  checkboxEntities: PropTypes.array,
  collections: PropTypes.object.isRequired,
  onCreateCollection: PropTypes.func.isRequired,
  onAddEntitiesToCollection: PropTypes.func.isRequired,
  onRemoveEntitiesFromCollection: PropTypes.func.isRequired,
  onDeselectEntities: PropTypes.func.isRequired,
  collection: PropTypes.object,
};

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import LibraryHeader from './library/LibraryHeader';
import LibraryListing from './library/LibraryListing';
import CheckboxEntityMenu from './library/CheckboxEntityMenu';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import { showModal } from '../actions/activeModal';
import { fetchLibrary } from '../actions/library';
import { deleteVisualisation } from '../actions/visualisation';
import { deleteDataset } from '../actions/dataset';
import { deleteDashboard } from '../actions/dashboard';
import { editCollection } from '../actions/collection';
import { showNotification } from '../actions/notification';
import * as entity from '../domain/entity';

require('./Library.scss');

function mergeQuery(location, query) {
  return Object.assign({}, location, {
    query: Object.assign({}, location.query, query),
  });
}

function updateQueryAction(location, query) {
  return push(mergeQuery(location, query));
}

const filterLibraryByCollection = (library, collection) => {
  const filteredLibrary = {};

  filteredLibrary.datasets = {};
  filteredLibrary.visualisations = {};
  filteredLibrary.dashboards = {};

  collection.entities.forEach((entityId) => {
    if (library.visualisations[entityId]) {
      filteredLibrary.visualisations[entityId] = library.visualisations[entityId];
    } else if (library.datasets[entityId]) {
      filteredLibrary.datasets[entityId] = library.datasets[entityId];
    } else if (library.dashboards[entityId]) {
      filteredLibrary.dashboards[entityId] = library.dashboards[entityId];
    }
  });

  return Object.assign({}, library, filteredLibrary);
};

class Library extends Component {

  constructor() {
    super();
    this.state = {
      pendingDeleteEntity: null,
      collection: null,
      checkboxEntities: [],
    };

    this.handleCheckEntity = this.handleCheckEntity.bind(this);
    this.handleEntityAction = this.handleEntityAction.bind(this);
    this.handleDeleteEntity = this.handleDeleteEntity.bind(this);
    this.handleCreateCollection = this.handleCreateCollection.bind(this);
    this.handleAddEntitiesToCollection = this.handleAddEntitiesToCollection.bind(this);
    this.handleRemoveEntitiesFromCollection = this.handleRemoveEntitiesFromCollection.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(fetchLibrary());
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.collections) {
      const collectionId = nextProps.params.collectionId;
      const collection = collectionId ? nextProps.collections[collectionId] : null;

      if (collection) {
        if (collection !== this.state.collection) {
          this.setState({ collection: Object.assign({}, collection) });
        }
      } else if (this.state.collection) {
        this.setState({ collection: null });
        this.props.dispatch(push('/library'));
      }

      if (collectionId && !collection) {
        this.props.dispatch(push('/library'));
      }
    }
  }

  handleCheckEntity(id) {
    let newCheckboxEntities = this.state.checkboxEntities.slice(0);

    if (newCheckboxEntities.indexOf(id) > -1) {
      newCheckboxEntities = newCheckboxEntities.filter(oldId => oldId !== id);
    } else {
      newCheckboxEntities.push(id);
    }

    this.setState({ checkboxEntities: newCheckboxEntities });
  }

  handleDeleteEntity(entityType, id) {
    const { dispatch, datasets } = this.props;
    switch (entityType) {
      case 'dataset':
        if (!entity.isPending(datasets[id])) {
          dispatch(deleteDataset(id));
        }
        break;
      case 'visualisation':
        dispatch(deleteVisualisation(id));
        break;
      case 'dashboard':
        dispatch(deleteDashboard(id));
        break;
      default:
        throw new Error(`Invalid entity type: ${entityType}`);
    }
  }
  handleCreateCollection(optionalEntities = []) {
    const entities = Array.isArray(optionalEntities) ? optionalEntities : [optionalEntities];

    if (entities) {
      return this.props.dispatch(showModal('create-collection', { entities }));
    }
    return this.props.dispatch(showModal('create-collection'));
  }
  handleDeleteCollection(collectionId) {
    return this.props.dispatch(
      showModal('delete-collection', { collection: this.props.collections[collectionId] })
    );
  }
  handleAddEntitiesToCollection(entityIds, collectionId) {
    const collection = this.props.collections[collectionId];

    // Convenience conversion so that "entityIds" can be a naked single ID
    const newEntities = Array.isArray(entityIds) ? entityIds : [entityIds];
    const oldEntities = collection.entities || [];

    const updatedEntityArray = oldEntities.slice(0);

    // Add any new entities that are not already in the collection
    newEntities.forEach((newEntity) => {
      if (oldEntities.every(oldEntity => oldEntity !== newEntity)) {
        updatedEntityArray.push(newEntity);
      }
    });

    const newCollection = Object.assign({}, collection, { entities: updatedEntityArray });
    this.props.dispatch(editCollection(newCollection));

    // Show a notification because there is no other visual feedback on adding item to collection
    this.props.dispatch(showNotification('info', `Added to ${collection.title}`, true));
  }
  handleRemoveEntitiesFromCollection(entityIds, collectionId) {
    const collection = this.props.collections[collectionId];

    // Convenience conversion so that "entityIds" can be a naked single ID
    const entitiesToRemove = Array.isArray(entityIds) ? entityIds : [entityIds];
    const oldEntities = collection.entities || [];

    const updatedEntityArray = [];

    // Add any new entities that are not already in the collection
    oldEntities.forEach((oldEntityId) => {
      if (!entitiesToRemove.some(entityToRemoveId => entityToRemoveId === oldEntityId)) {
        updatedEntityArray.push(oldEntityId);
      }
    });

    const newCollection = Object.assign({}, collection, { entities: updatedEntityArray });

    this.props.dispatch(editCollection(newCollection));
  }
  handleEntityAction(actionType, entityType, entityId) {
    if (actionType === 'delete') {
      this.setState({ pendingDeleteEntity: { entityType, entityId } });
    } else if (actionType === 'add-to-collection:new') {
      if (!this.state.collection) {
        this.handleCreateCollection(entityId);
      }
    } else if (actionType.indexOf('add-to-collection:') > -1) {
      if (!this.state.collection) {
        const collectionId = actionType.replace('add-to-collection:', '');

        this.handleAddEntitiesToCollection(entityId, collectionId);
      }
    } else if (actionType.indexOf('remove-from-collection:') > -1) {
      const collectionId = actionType.replace('remove-from-collection:', '');

      this.handleRemoveEntitiesFromCollection(entityId, collectionId);
    } else {
      throw new Error(`Action ${actionType} not yet implemented for entity type ${entityType}`);
    }
  }

  render() {
    const { dispatch,
      location,
      datasets,
      visualisations,
      dashboards } = this.props;
    const collections = this.props.collections ? this.props.collections : {};
    const { pendingDeleteEntity, collection } = this.state;
    const query = location.query;
    const displayMode = query.display || 'grid';
    const sortOrder = query.sort || 'last_modified';
    const isReverseSort = query.reverse === 'true';
    const filterBy = query.filter || 'all';
    const searchString = query.search || '';


    return (
      <div className="Library">
        {this.state.pendingDeleteEntity &&
          <DeleteConfirmationModal
            isOpen
            entityId={pendingDeleteEntity.entityId}
            entityType={pendingDeleteEntity.entityType}
            library={{ datasets, visualisations, dashboards }}
            onCancel={() => this.setState({ pendingDeleteEntity: null })}
            onDelete={() => {
              this.setState({ pendingDeleteEntity: null });
              this.handleDeleteEntity(
                pendingDeleteEntity.entityType,
                pendingDeleteEntity.entityId
              );
            }}
          />
        }
        <LibraryHeader
          location={collection ? collection.title : 'Library'}
          onCreateCollection={this.handleCreateCollection}
          onAddEntitiesToCollection={this.handleAddEntitiesToCollection}
          onRemoveEntitiesFromCollection={this.handleRemoveEntitiesFromCollection}
          displayMode={displayMode}
          onChangeDisplayMode={(newDisplayMode) => {
            dispatch(updateQueryAction(location, {
              display: newDisplayMode,
            }));
          }}
          sortOrder={sortOrder}
          onChangeSortOrder={(newSortOrder) => {
            dispatch(updateQueryAction(location, {
              sort: newSortOrder,
            }));
          }}
          isReverseSort={isReverseSort}
          onChangeReverseSort={(newReverseSort) => {
            dispatch(updateQueryAction(location, {
              reverse: newReverseSort,
            }));
          }}
          filterBy={filterBy}
          onChangeFilterBy={(newFilterBy) => {
            dispatch(updateQueryAction(location, {
              filter: newFilterBy,
            }));
          }}
          searchString={searchString}
          onSetSearchString={(newSearchString) => {
            dispatch(updateQueryAction(location, {
              search: newSearchString,
            }));
          }}
          onCreate={(type) => {
            if (type === 'dataset') {
              // Data set creation is handled in a modal
              dispatch(showModal('create-dataset'));
            } else if (type === 'collection') {
              dispatch(showModal('create-collection'));
            } else {
              dispatch(push(`/${type}/create`));
            }
          }}
        />
        <LibraryListing
          displayMode={displayMode}
          sortOrder={sortOrder}
          isReverseSort={isReverseSort}
          filterBy={filterBy}
          searchString={searchString}
          collections={collections}
          currentCollection={collection}
          library={collection ? filterLibraryByCollection(this.props, collection) : this.props}
          checkboxEntities={this.state.checkboxEntities}
          onCheckEntity={this.handleCheckEntity}
          onEntityAction={this.handleEntityAction}
        />
        {this.props.children}
        {this.state.checkboxEntities.length > 0 &&
          <CheckboxEntityMenu
            collections={collections}
            collection={collection}
            onCreateCollection={this.handleCreateCollection}
            onAddEntitiesToCollection={this.handleAddEntitiesToCollection}
            onRemoveEntitiesFromCollection={this.handleRemoveEntitiesFromCollection}
            checkboxEntities={this.state.checkboxEntities}
            onDeselectEntities={() => this.setState({ checkboxEntities: [] })}
          />
        }
      </div>
    );
  }
}

Library.propTypes = {
  dispatch: PropTypes.func,
  location: PropTypes.object,
  params: PropTypes.object,
  children: PropTypes.element,
  datasets: PropTypes.object.isRequired,
  visualisations: PropTypes.object.isRequired,
  dashboards: PropTypes.object.isRequired,
  collections: PropTypes.object,
};

export default connect(state => state.library)(Library);

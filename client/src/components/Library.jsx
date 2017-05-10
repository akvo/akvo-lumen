import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
import LibraryHeader from './library/LibraryHeader';
import LibraryListing from './library/LibraryListing';
import DeleteConfirmationModal from './modals/DeleteConfirmationModal';
import { showModal } from '../actions/activeModal';
import { fetchLibrary } from '../actions/library';
import { deleteVisualisation } from '../actions/visualisation';
import { deleteDataset } from '../actions/dataset';
import { deleteDashboard } from '../actions/dashboard';
import { editCollection } from '../actions/collection';
import * as entity from '../domain/entity';

require('../styles/Library.scss');

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
      filteredLibrary.visualisations[entity.id] = library.visualisations[entityId];
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

    this.handleSelectEntity = this.handleSelectEntity.bind(this);
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
    const collection = nextProps.params.collectionId ? nextProps.collections[nextProps.params.collectionId] : null;

    if (collection) {
      if (collection !== this.state.collection) {
        console.log('setting new collection');
        this.setState({ collection: Object.assign({}, collection) });
      }
    } else if (this.state.collection) {
      this.setState({ collection: null });
    }
  }

  handleCheckEntity(id) {
    let newCheckboxEntities = this.state.checkboxEntities.slice(0);

    if (newCheckboxEntities.indexOf(id) > -1) {
      newCheckboxEntities = newCheckboxEntities.filter(e_id => e_id !== id);
    } else {
      newCheckboxEntities.push(id);
    }

    this.setState({ checkboxEntities: newCheckboxEntities });
  }

  handleSelectEntity(entityType, id) {
    this.props.dispatch(push(`/${entityType}/${id}`));
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
  handleCreateCollection(optionalEntities) {
    if (optionalEntities) {
      console.log(`adding ${optionalEntities.length} optionalEntities`);
      return this.props.dispatch(showModal('create-collection', { entities: optionalEntities }));
    }
    return this.props.dispatch(showModal('create-collection'));
  }
  handleAddEntitiesToCollection(entityIds, collectionId) {
    const collection = this.props.collections[collectionId];

    // Convenience conversion so that "entityIds" can be a naked single ID
    const newEntities = Array.isArray(entityIds) ? entityIds : [entityIds];
    const oldEntities = collection.entities || [];

    const updatedEntityArray = oldEntities.slice(0);

    // Add any new entities that are not already in the collection
    newEntities.forEach((newEntity) => {
      if (oldEntities.every(oldEntity => oldEntity.id !== newEntity.id)) {
        updatedEntityArray.push(newEntity);
      }
    });

    const newCollection = Object.assign({}, collection, { entities: updatedEntityArray });

    this.props.dispatch(editCollection(newCollection));
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

    console.log(newCollection);
    this.props.dispatch(editCollection(newCollection));
  }
  handleEntityAction(actionType, entityType, entityId) {
    if (actionType === 'delete') {
      this.setState({ pendingDeleteEntity: { entityType, entityId } });
    } else if (actionType === 'add-to-collection') {
      if (!this.state.collection) {
        console.log('hello');
      }
    } else {
      throw new Error(`Action ${actionType} not yet implemented for entity type ${entityType}`);
    }
  }

  render() {
    const { dispatch, location, params, datasets, visualisations, collections, dashboards } = this.props;
    const { pendingDeleteEntity, collection } = this.state;
    const query = location.query;
    const displayMode = query.display || 'list';
    const sortOrder = query.sort || 'last_modified';
    const isReverseSort = query.reverse === 'true';
    const filterBy = query.filter || 'all';
    const searchString = query.search || '';

    return (
      <div className="Library">
        {this.state.pendingDeleteEntity ?
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
          /> : null
        }
        <LibraryHeader
          location={collection ? collection.name : 'Library'}
          checkboxEntities={this.state.checkboxEntities}
          collections={collections}
          collection={collection}
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
            if (newSearchString !== '') {
              dispatch(updateQueryAction(location, {
                search: newSearchString,
              }));
            }
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
          onDeselectEntities={() => this.setState({ checkboxEntities: [] })}
        />
        <LibraryListing
          displayMode={displayMode}
          sortOrder={sortOrder}
          isReverseSort={isReverseSort}
          filterBy={filterBy}
          searchString={searchString}
          collection={collection}
          library={collection ? filterLibraryByCollection(this.props, collection) : this.props}
          checkboxEntities={this.state.checkboxEntities}
          onSelectEntity={this.handleSelectEntity}
          onCheckEntity={this.handleCheckEntity}
          onEntityAction={this.handleEntityAction}
        />
        {this.props.children}
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
};

export default connect(state => state.library)(Library);

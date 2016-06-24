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

require('../styles/Library.scss');

function mergeQuery(location, query) {
  return Object.assign({}, location, {
    query: Object.assign({}, location.query, query),
  });
}

function updateQueryAction(location, query) {
  return push(mergeQuery(location, query));
}

class Library extends Component {

  constructor() {
    super();
    this.state = {
      pendingDeleteEntity: null,
    };

    this.handleSelectEntity = this.handleSelectEntity.bind(this);
    this.handleEntityAction = this.handleEntityAction.bind(this);
    this.handleDeleteEntity = this.handleDeleteEntity.bind(this);
  }

  componentDidMount() {
    this.props.dispatch(fetchLibrary());
  }


  handleSelectEntity(entityType, id) {
    this.props.dispatch(push(`/${entityType}/${id}`));
  }

  handleDeleteEntity(entityType, id) {
    const { dispatch, datasets } = this.props;
    switch (entityType) {
      case 'dataset':
        if (datasets[id].status !== 'PENDING') {
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

  handleEntityAction(actionType, entityType, entityId) {
    if (actionType === 'delete') {
      this.setState({ pendingDeleteEntity: { entityType, entityId } });
    } else {
      throw new Error(`Action ${actionType} not yet implemented for entity type ${entityType}`);
    }
  }

  render() {
    const { dispatch, location, params, datasets, visualisations, dashboards } = this.props;
    const { pendingDeleteEntity } = this.state;
    const query = location.query;
    const displayMode = query.display || 'list';
    const sortOrder = query.sort || 'last_modified';
    const isReverseSort = query.reverse === 'true';
    const filterBy = query.filter || 'all';
    const searchString = query.search || '';
    const collection = params.collection || null;

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
          pathname={this.props.location.pathname}
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
          collection={collection}
          library={this.props}
          onSelectEntity={this.handleSelectEntity}
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

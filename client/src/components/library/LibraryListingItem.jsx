import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';
import LoadingSpinner from '../common/LoadingSpinner';
import ContextMenu from '../common/ContextMenu';
import {
  getTitle, getType, getId,
  getErrorMessage, isPending,
  isFailed, isOk, getStatus,
} from '../../domain/entity';

function getCollectionContextMenuItem(collections, currentCollection) {
  if (currentCollection) {
    return ({
      label: (
        <FormattedMessage
          id="remove_collection"
          values={{ title: currentCollection.title }}
        />
      ),
      value: `remove-from-collection:${currentCollection.id}`,
    });
  }

  return ({
    label: <FormattedMessage id="add_to_collection" />,
    value: 'add-to-collection:new',
    subMenu: [
      ...Object.keys(collections).map(key => ({
        value: `add-to-collection:${key}`,
        label: collections[key].title,
      })),
      {
        label: <FormattedMessage id="new_collection" />,
        value: 'add-to-collection:new',
        customClass: 'newCollection',
      },
    ],
  });
}

function contextMenuOptions(entityType, collections, currentCollection) {
  const options = [
    {
      label: <FormattedMessage id="duplicate" />,
      value: 'duplicate',
      customClass: 'notImplemented',
    }, {
      label: <FormattedMessage id="set_permissions" />,
      value: 'set-permissions',
      customClass: 'notImplemented',
    }, {
      label: <FormattedMessage id="add_to_dashboard" />,
      value: 'add-to-dashboard',
      customClass: 'notImplemented',
    },
    getCollectionContextMenuItem(collections, currentCollection),
    {
      label: <FormattedMessage id="view_details" />,
      value: 'view-details',
      customClass: 'notImplemented',
    }, {
      label: <FormattedMessage id="delete" />,
      value: 'delete',
    },
  ];

  if (entityType === 'dataset') {
    options.push({
      label: <FormattedMessage id="update" />,
      value: 'update-dataset',
    });
  }

  return options;
}

function LibraryListingItemContextMenu({
  entityType,
  onClick,
  collections = {},
  currentCollection,
  onWindowClick,
}) {
  const options = contextMenuOptions(entityType, collections, currentCollection);
  return (
    <ContextMenu
      style={{ width: 200 }}
      subMenuSide="left"
      onOptionSelected={onClick}
      options={options}
      onWindowClick={onWindowClick}
    />
  );
}

LibraryListingItemContextMenu.propTypes = {
  entityType: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  collections: PropTypes.object.isRequired,
  currentCollection: PropTypes.object,
  onWindowClick: PropTypes.func.isRequired,
};

export default class LibraryListingItem extends Component {

  constructor() {
    super();
    this.state = {
      contextMenuVisible: false,
    };
    this.handleToggleContextMenu = this.handleToggleContextMenu.bind(this);
  }

  handleToggleContextMenu(event) {
    event.stopPropagation();
    const { contextMenuVisible } = this.state;
    this.setState({ contextMenuVisible: !contextMenuVisible });
  }

  render() {
    const { entity, onEntityAction } = this.props;

    return (
      <li
        onMouseLeave={() => this.setState({ contextMenuVisible: false })}
        key={getId(entity)}
        className={`LibraryListingItem ${getType(entity)} ${getStatus(entity)} ${getId(entity)}`}
        data-test-name={getTitle(entity)}
        data-test-id={getId(entity)}
      >
        {isPending(entity) &&
          <div className="pendingOverlay" data-test-id="pending">
            <LoadingSpinner />
          </div>
        }
        <Link
          to={{
            pathname: `/${getType(entity)}/${getId(entity)}`,
            state: { from: 'library' },
          }}
          className="entityBody clickable"
          onClick={(e) => {
            if (!isOk(entity)) {
              // prevent navigation - unfortunately this is the only way to "disable" a <Link />
              e.preventDefault();
            }
          }}
        >
          <div
            className={`entityIcon ${getType(entity) === 'visualisation' ?
              entity.visualisationType.replace(' ', '-') : ''}`}
          />
          <div className="textContents">
            <h3 className="entityName">
              {getTitle(entity)}
              {isFailed(entity) && ' (Import failed)'}
            </h3>
            {isFailed(entity) && <p>{getErrorMessage(entity)}</p>}
            {isPending(entity) && <p><FormattedMessage id="pending" />...</p>}
            {getType(entity) === 'visualisation' && (
              <div className="VisualisationTypeLabel">
                <p>
                  <FormattedMessage id={entity.visualisationType} />
                </p>
              </div>
            )}
          </div>
        </Link>
        <div
          className={`checkboxContainer ${this.props.showCheckbox ? 'show' : ''}`}
          onClick={() => {
            this.props.onCheckEntity(getId(entity));
          }}
        >
          <input
            type="checkbox"
            checked={this.props.isChecked}
          />
        </div>
        <div className="entityControls">
          <button
            className="showControls clickable"
            data-test-id="show-controls"
            onClick={this.handleToggleContextMenu}
          >
            ...
          </button>
          {this.state.contextMenuVisible &&
            <LibraryListingItemContextMenu
              entityType={getType(entity)}
              collections={this.props.collections}
              currentCollection={this.props.currentCollection}
              onClick={(actionType) => {
                this.setState({ contextMenuVisible: false });
                onEntityAction(actionType, getType(entity), getId(entity));
              }}
              onWindowClick={() => this.setState({ contextMenuVisible: false })}
            />}
        </div>
      </li>
    );
  }
}

LibraryListingItem.propTypes = {
  entity: PropTypes.object.isRequired,
  onEntityAction: PropTypes.func.isRequired,
  collections: PropTypes.object.isRequired,
  currentCollection: PropTypes.object,
  onCheckEntity: PropTypes.func.isRequired,
  isChecked: PropTypes.bool.isRequired,
  showCheckbox: PropTypes.bool,
};

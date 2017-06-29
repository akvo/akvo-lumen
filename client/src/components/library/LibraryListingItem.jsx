import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
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
      label: `Remove from ${currentCollection.title}`,
      value: `remove-from-collection:${currentCollection.id}`,
    });
  }

  return ({
    label: 'Add to collection',
    value: 'add-to-collection:new',
    subMenu: [
      ...Object.keys(collections).map(key => ({
        value: `add-to-collection:${key}`,
        label: collections[key].title,
      })),
      {
        label: 'New collection',
        value: 'add-to-collection:new',
        customClass: 'newCollection',
      },
    ],
  });
}

function LibraryListingItemContextMenu({
  onClick,
  collections = {},
  currentCollection,
  onWindowClick,
}) {
  return (
    <ContextMenu
      style={{ width: 200 }}
      subMenuSide="left"
      onOptionSelected={onClick}
      options={[
        {
          label: 'Duplicate',
          value: 'duplicate',
          customClass: 'notImplemented',
        }, {
          label: 'Set permissions',
          value: 'set-permissions',
          customClass: 'notImplemented',
        }, {
          label: 'Add to dashboard',
          value: 'add-to-dashboard',
          customClass: 'notImplemented',
        },
        getCollectionContextMenuItem(collections, currentCollection),
        {
          label: 'View details',
          value: 'view-details',
          customClass: 'notImplemented',
        }, {
          label: 'Delete',
          value: 'delete',
        },
      ]}
      onWindowClick={onWindowClick}
    />
  );
}

const VisualisationTypeLabel = ({ vType }) => {
  let typeLabel = '';

  switch (vType) {
    case 'map':
    case 'pivot table':
      typeLabel = vType;
      break;

    default:
      typeLabel = `${vType} chart`;
  }

  typeLabel = `${typeLabel.substring(0, 1).toUpperCase()}${typeLabel.substring(1, typeLabel.length)}`;

  return (
    <div
      className="VisualisationTypeLabel"
    >
      <p>
        {typeLabel}
      </p>
    </div>
  );
};

VisualisationTypeLabel.propTypes = {
  vType: PropTypes.string.isRequired,
};

LibraryListingItemContextMenu.propTypes = {
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
      >
        {isPending(entity) &&
          <div className="pendingOverlay">
            <LoadingSpinner />
          </div>
        }
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
        <Link
          to={`/${getType(entity)}/${getId(entity)}`}
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
            {isPending(entity) && <p>Pending...</p>}
            {getType(entity) === 'visualisation' &&
              <VisualisationTypeLabel
                vType={entity.visualisationType}
              />
            }
          </div>
        </Link>
        <div className="entityControls">
          <button
            className="showControls clickable"
            onClick={this.handleToggleContextMenu}
          >
            ...
          </button>
          {this.state.contextMenuVisible &&
            <LibraryListingItemContextMenu
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

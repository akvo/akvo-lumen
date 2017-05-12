import React, { PropTypes, Component } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ContextMenu from '../common/ContextMenu';
import {
  getTitle, getType, getId,
  getErrorMessage, isPending,
  isFailed, isOk, getStatus,
} from '../../domain/entity';

function LibraryListingItemContextMenu({ onClick, collections = {} }) {
  return (
    <ContextMenu
      style={{ width: 200 }}
      subMenuSide="left"
      onOptionSelected={onClick}
      options={[
        {
          label: 'Duplicate',
          value: 'duplicate',
        }, {
          label: 'Set permissions',
          value: 'set-permissions',
        }, {
          label: 'Add to dashboard',
          value: 'add-to-dashboard',
        }, {
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
        }, {
          label: 'View details',
          value: 'view-details',
        }, {
          label: 'Delete',
          value: 'delete',
        },
      ]}
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
    const { entity, onSelectEntity, onEntityAction } = this.props;

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
          className="checkboxContainer"
          onClick={() => {
            this.props.onCheckEntity(getId(entity));
          }
          }
        >
          <input
            type="checkbox"
            checked={this.props.isChecked}
          />
        </div>
        <div
          className="entityBody clickable"
          onClick={() => {
            if (isOk(entity)) {
              onSelectEntity(getType(entity), getId(entity));
            }
          }}
        >
          <div className="entityIcon" />
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
        </div>
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
              onClick={(actionType) => {
                this.setState({ contextMenuVisible: false });
                onEntityAction(actionType, getType(entity), getId(entity));
              }}
            />}
        </div>
      </li>
    );
  }
}

LibraryListingItem.propTypes = {
  entity: PropTypes.object.isRequired,
  onSelectEntity: PropTypes.func.isRequired,
  onEntityAction: PropTypes.func.isRequired,
  collections: PropTypes.object.isRequired,
  onCheckEntity: PropTypes.func.isRequired,
  isChecked: PropTypes.bool.isRequired,
};

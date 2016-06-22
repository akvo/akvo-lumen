import React, { PropTypes, Component } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ContextMenu from '../common/ContextMenu';
import {
  getTitle, getType, getId,
  getErrorMessage, isPending,
  isFailed, isOk, getStatus,
} from '../../domain/entity';

function LibraryListingItemContextMenu({ onClick }) {
  return (
    <ContextMenu
      style={{ width: 200 }}
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
          value: 'add-to-collection',
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

LibraryListingItemContextMenu.propTypes = {
  onClick: PropTypes.func.isRequired,
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
        onClick={() => {
          if (isOk(entity)) {
            onSelectEntity(getType(entity), getId(entity));
          }
        }}
        key={getId(entity)}
        className={`LibraryListingItem ${getType(entity)} ${getStatus(entity)}`}
      >
        {isPending(entity) &&
          <div className="pendingOverlay">
            <LoadingSpinner />
          </div>
        }
        <input type="checkbox" className="selectEntity disabled" />
        <div className="entityIcon"></div>
        <div className="textContents">
          <h3 className="entityName">
            {getTitle(entity)}
            {isFailed(entity) && ' (Import failed)'}
          </h3>
          {isFailed(entity) && <p>{getErrorMessage(entity)}</p>}
          {isPending(entity) && <p>Pending...</p>}
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
};

import React, { PropTypes, Component } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import ContextMenu from '../common/ContextMenu';

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
    const status = entity.status;
    return (
      <li
        onClick={() => {
          if (status === 'OK') {
            onSelectEntity(entity.type, entity.id);
          }
        }}
        key={entity.id}
        className={`LibraryListingItem ${entity.type} ${status}`}
      >
        {status === 'PENDING' &&
          <div className="pendingOverlay">
            <LoadingSpinner />
          </div>
        }
        <input type="checkbox" className="selectEntity disabled" />
        <div className="entityIcon"></div>
        <div className="textContents">
          <h3 className="entityName">
            {entity.name || entity.title}
            {status === 'FAILED' && ' (Import failed)'}
          </h3>
          {status === 'FAILED' && <p>{entity.reason}</p>}
          {status === 'PENDING' && <p>Pending...</p>}
        </div>
        <div className="entityControls">
          <button
            className="showControls clickable"
            onClick={this.handleToggleContextMenu}
          >
            ...
          </button>
          {this.state.contextMenuVisible ?
            <LibraryListingItemContextMenu
              onClick={(actionType) => {
                this.setState({ contextMenuVisible: false });
                onEntityAction(actionType, entity.type, entity.id);
              }}
            /> : null}
        </div>
      </li>
    );
  }
}

LibraryListingItem.propTypes = {
  entity: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['dataset', 'visualisation', 'dashboard']).isRequired,
    status: PropTypes.oneOf(['OK', 'FAILED', 'PENDING']).isRequired,
    reason: PropTypes.string,
  }).isRequired,
  onSelectEntity: PropTypes.func.isRequired,
  onEntityAction: PropTypes.func.isRequired,
};

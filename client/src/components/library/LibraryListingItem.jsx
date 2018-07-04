import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import itsSet from 'its-set';
import { FormattedMessage, FormattedRelative, intlShape } from 'react-intl';
import LoadingSpinner from '../common/LoadingSpinner';
import ContextMenu from '../common/ContextMenu';
import {
  getTitle, getType, getId,
  getErrorMessage, isPending,
  isFailed, isOk, getStatus,
  getAuthor, getModifiedTimestamp,
  getSource,
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

const VisualisationLabel = ({ children, title = '', className = '' }) => (
  <div
    title={title}
    className={`VisualisationLabel ${className}`}
  >
    <p>
      {children}
    </p>
  </div>
);

VisualisationLabel.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  title: PropTypes.string,
};

const VisualisationTypeLabel = ({ vType, ...rest }) => {
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
    <VisualisationLabel {...rest}>{typeLabel}</VisualisationLabel>
  );
};

VisualisationTypeLabel.propTypes = {
  vType: PropTypes.string.isRequired,
};

LibraryListingItemContextMenu.propTypes = {
  entityType: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  collections: PropTypes.object.isRequired,
  currentCollection: PropTypes.object,
  onWindowClick: PropTypes.func.isRequired,
};

export default class LibraryListingItem extends Component {

  static contextTypes = {
    intl: intlShape,
  };

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
    const author = getAuthor(entity);
    const modified = getModifiedTimestamp(entity);
    const { formatMessage, formatDate, formatTime } = this.context.intl;
    const entityType = getType(entity);
    const entitySource = getSource(entity);

    return (
      <li
        onMouseLeave={() => this.setState({ contextMenuVisible: false })}
        key={getId(entity)}
        className={`LibraryListingItem ${entityType} ${getStatus(entity)} ${getId(entity)}`}
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
            pathname: `/${entityType}/${getId(entity)}`,
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
            className={`entityIcon ${entityType === 'visualisation' ?
              entity.visualisationType.replace(' ', '-') : ''}`}
          />
          <div className="textContents">
            <h3 className="entityName">
              {getTitle(entity)}
              {isFailed(entity) && ' (Import failed)'}
            </h3>
            {isFailed(entity) && <p>{getErrorMessage(entity)}</p>}
            <ul>
              {isPending(entity) && (
                <li>
                  <VisualisationLabel className="VisualisationLabel__type">
                    <FormattedMessage id="pending" />...
                  </VisualisationLabel>
                </li>
              )}
              {entityType === 'visualisation' && (
                <li>
                  <VisualisationTypeLabel
                    className="VisualisationLabel__type"
                    vType={entity.visualisationType}
                  />
                </li>
              )}
              {(entityType === 'dataset' && itsSet(entitySource, 'kind')) ? (
                <li>
                  <VisualisationLabel className="VisualisationLabel__type">
                    <FormattedMessage id={entitySource.kind.toLowerCase()} />
                  </VisualisationLabel>
                </li>
              ) : null}
              <li>
                {(author || modified) && (
                  <VisualisationLabel className="VisualisationLabel__meta">
                    {author && (
                      <span title={`${formatMessage({ id: 'created_by' })}: ${author}`}>
                        {author}
                      </span>
                    )}
                    {author && modified && (
                      <span>&nbsp;|&nbsp;</span>
                    )}
                    {modified && (
                      <span
                        title={`${formatMessage({ id: 'last_modified' })}: ${formatDate(modified)}, ${formatTime(modified)}`}
                      >
                        <FormattedRelative value={modified} />
                      </span>
                    )}
                  </VisualisationLabel>
                )}
              </li>
            </ul>
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
              entityType={entityType}
              collections={this.props.collections}
              currentCollection={this.props.currentCollection}
              onClick={(actionType) => {
                this.setState({ contextMenuVisible: false });
                onEntityAction(actionType, entityType, getId(entity));
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

import React from 'react';
import PropTypes from 'prop-types';
import ModalWrapper from 'react-modal';
import ModalHeader from './ModalHeader';
import ModalFooter from './ModalFooter';
import { getTitle, getId } from '../../domain/entity';

require('./DeleteConfirmationModal.scss');

function getEntity(entityId, entityType, library) {
  switch (entityType) {
    case 'dataset':
      return library.datasets[entityId];
    case 'visualisation':
      return library.visualisations[entityId];
    case 'dashboard':
      return library.dashboards[entityId];
    case 'raster':
      return library.rasters[entityId];
    default:
      throw new Error(`Unknown entity type ${entityType}`);
  }
}

function VisualisationsList({ datasetId, visualisations }) {
  const dependentVisualisations = Object.keys(visualisations)
    .map(id => visualisations[id])
    .filter((vis) => {
      if (vis.datasetId === datasetId) {
        return true;
      }
      if (
        vis.visualisationType === 'map' &&
        vis.spec &&
        vis.spec.layers &&
        vis.spec.layers.some(layer => layer.datasetId === datasetId)
      ) {
        return true;
      }
      return false;
    })
    .map((vis, idx) => <li key={idx}>{vis.name}</li>);

  if (dependentVisualisations.length > 0) {
    return (
      <div>
        <p>
          The following
          {dependentVisualisations.length === 1
            ? ' visualisation '
            : ` ${dependentVisualisations.length} visualisations `}
          will also be deleted:
        </p>
        <ul>{dependentVisualisations}</ul>
      </div>
    );
  }
  return (
    <div>
      <span>No visualisations depend on this datataset</span>
    </div>
  );
}

VisualisationsList.propTypes = {
  datasetId: PropTypes.string.isRequired,
  visualisations: PropTypes.object.isRequired,
};


function DashboardsList({ datasetId, dashboards }) {
  const dependentDashboards = Object.keys(dashboards)
    .map(id => dashboards[id])
    .filter((dash) => {
      if (dash.filter.datasetId === datasetId) {
        return true;
      }
      return false;
    })
    .map((dash, idx) => <li key={idx}>{dash.title}</li>);

  if (dependentDashboards.length > 0) {
    return (
      <div>
        <p>
          The following
          {dependentDashboards.length === 1
            ? ' dashboard '
            : ` ${dependentDashboards.length} dashboards `}
          will not be more filtered by the dataset to be removed:
        </p>
        <ul>{dependentDashboards}</ul>
      </div>
    );
  }
  return (
    <div>
      <span>No filters dashboards depend on this datataset</span>
    </div>
  );
}

DashboardsList.propTypes = {
  datasetId: PropTypes.string.isRequired,
  dashboards: PropTypes.object.isRequired,
};


export default function DeleteConfirmationModal({
  isOpen,
  onCancel,
  onDelete,
  entityId,
  entityType,
  library,
  filteredDashboard,
}) {
  const entity = getEntity(entityId, entityType, library);

  return (
    <ModalWrapper
      isOpen={isOpen}
      contentLabel="userInviteModal"
      style={{
        content: {
          width: 500,
          height: entityType === 'dataset' ? 400 : 200,
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: 0,
          border: '0.1rem solid rgb(223, 244, 234)',
          display: 'flex',
          flexDirection: 'column',
        },
        overlay: {
          zIndex: 1000,
          backgroundColor: 'rgba(0,0,0,0.6)',
        },
      }}
    >
      <div className="DeleteConfirmationModal">
        <ModalHeader title={`Delete ${entityType} ${getTitle(entity)}?`} onCloseModal={onCancel} />
        <div className="ModalContents">
          {entityType === 'dataset' && (
            <div>
              <VisualisationsList
                datasetId={getId(entity)}
                visualisations={library.visualisations}
              />
              {filteredDashboard &&
              <DashboardsList
                datasetId={getId(entity)}
                dashboards={library.dashboards}
              />
              }
            </div>
            )}
        </div>
        <ModalFooter
          leftButton={{
            text: 'Cancel',
            className: 'cancel',
            onClick: onCancel,
          }}
          rightButton={{
            className: 'delete',
            onClick: onDelete,
            text: `Delete ${entityType}`,
          }}
        />
      </div>
    </ModalWrapper>
  );
}

DeleteConfirmationModal.propTypes = {
  onDelete: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  library: PropTypes.shape({
    datasets: PropTypes.object.isRequired,
    visualisations: PropTypes.object.isRequired,
    dashboards: PropTypes.object.isRequired,
  }),
  entityId: PropTypes.string.isRequired,
  entityType: PropTypes.oneOf(['dataset', 'visualisation', 'dashboard', 'raster']).isRequired,
  filteredDashboard: PropTypes.bool,
};

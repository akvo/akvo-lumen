import React, { PropTypes } from 'react';
import Modal from 'react-modal';

function getEntity(entityId, entityType, library) {
  switch (entityType) {
    case 'dataset': return library.datasets[entityId];
    case 'visualisation': return library.visualisations[entityId];
    case 'dashboard': return library.dashboards[entityId];
    default: throw new Error(`Unknown entity type ${entityType}`);
  }
}

function VisualisationsList({ datasetId, visualisations }) {
  const dependentVisualisations = Object.keys(visualisations)
    .map(id => visualisations[id])
    .filter(vis => vis.datasetId === datasetId)
    .map(vis => <li>{vis.name}</li>);

  if (dependentVisualisations.length > 0) {
    return (
      <div>
        <span>The following visualisations will also be deleted:</span>
        <ul>
          {dependentVisualisations}
        </ul>
      </div>
    );
  }
  return <div><span>No visualisations depend on this datataset</span></div>;
}

VisualisationsList.propTypes = {
  datasetId: PropTypes.string.isRequired,
  visualisations: PropTypes.object.isRequired,
};

export default function DeleteConfirmationModal({
  onCancel,
  onDelete,
  entityId,
  entityType,
  library,
}) {
  const entity = getEntity(entityId, entityType, library);

  return (
    <Modal
      isOpen
      style={{
        content: {
          width: 500,
          height: 300,
          marginLeft: 'auto',
          marginRight: 'auto',
          borderRadius: 0,
          border: '0.1rem solid rgb(223, 244, 234)',
        },
        overlay: {
          zIndex: 99,
          backgroundColor: 'rgba(0,0,0,0.6)',
        },
      }}
    >
      <div>
        <div>
          <h2 className="modalTitle">{`Delete ${entityType} ${entity.name || entity.title}`}</h2>
          <div
            className="close clickable"
            onClick={onCancel}
          >
            +
          </div>
          <div className="contents">
            {entityType === 'dataset' ?
              <VisualisationsList
                datasetId={entity.id}
                visualisations={library.visualisations}
              /> : null
            }
          </div>
          <div className="controls">
            <button
              className="cancel clickable negative"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="create clickable positive"
              onClick={onDelete}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </Modal>
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
  entityType: PropTypes.oneOf(['dataset', 'visualisation', 'dashboard']).isRequired,
};

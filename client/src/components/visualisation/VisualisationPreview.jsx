import React from 'react';
import PropTypes from 'prop-types';
import VisualisationViewer from '../charts/VisualisationViewer';

require('./VisualisationPreview.scss');

function shouldRender(visualisation, datasets) {
  const datasetId = visualisation.datasetId;
  const dataset = datasetId ? datasets[datasetId] : null;
  const datasetLoaded = dataset ? Boolean(dataset.get('columns')) : false;
  const vType = visualisation.visualisationType;
  const { spec } = visualisation;

  switch (vType) {
    case 'map':
      return true;

    case 'pivot table':
      if (!datasetLoaded) {
        return false;
      }
      break;

    case 'bar':
      if (!datasetLoaded) {
        return false;
      }
      if (spec.bucketColumn == null) {
        return false;
      }
      break;

    case 'line':
    case 'area':
      if (!datasetLoaded) {
        return false;
      }
      if (spec.metricColumnY == null) {
        return false;
      }
      break;

    case 'pie':
    case 'donut':
      if (!datasetLoaded) {
        return false;
      }
      if (spec.bucketColumn == null) {
        return false;
      }
      break;

    case 'scatter':
      if (!datasetLoaded) {
        return false;
      }
      if (spec.metricColumnX == null || spec.metricColumnY == null) {
        return false;
      }
      break;

    default:
      return false;
  }

  return true;
}

export default function CreateVisualisationPreview({
  visualisation,
  metadata,
  datasets,
  onChangeVisualisationSpec,
}) {
  return (
    <div className="VisualisationPreview">
      {shouldRender(visualisation, datasets) ?
        <VisualisationViewer
          visualisation={visualisation}
          metadata={metadata}
          datasets={datasets}
          context="editor"
          height={visualisation.visualisationType === 'map' ? null : 500}
          width={visualisation.visualisationType === 'map' ? null : 800}
          onChangeVisualisationSpec={onChangeVisualisationSpec}
        /> : null
      }
    </div>
  );
}

CreateVisualisationPreview.propTypes = {
  visualisation: PropTypes.object.isRequired,
  metadata: PropTypes.object,
  datasets: PropTypes.object.isRequired,
  onChangeVisualisationSpec: PropTypes.func,
};

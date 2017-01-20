import React, { PropTypes } from 'react';
import VisualisationViewer from '../charts/VisualisationViewer';

require('../../styles/VisualisationPreview.scss');


function shouldRender(visualisation, datasets) {
  const datasetId = visualisation.datasetId;
  if (visualisation.visualisationType === 'map') {
    return true;
  }
  if (datasetId == null) {
    return false;
  }
  const dataset = datasets[datasetId];
  if (dataset == null) {
    return false;
  }
  if (dataset.get('columns') == null) {
    return false;
  }
  const { spec, visualisationType } = visualisation;
  const haveDataColumn = spec.metricColumnY != null || spec.longitude != null;
  if (!haveDataColumn) {
    return false;
  }
  const needSecondDataColumn = visualisationType === 'scatter';
  const haveSecondDataColumn = spec.metricColumnX != null || spec.latitude !== null;
  if (needSecondDataColumn && !haveSecondDataColumn) {
    return false;
  }
  const needAggregation = visualisationType === 'bar' || visualisationType === 'pie' || visualisationType === 'donut';
  const haveAggregation = spec.bucketColumn !== null;
  if (needAggregation && !haveAggregation) {
    return false;
  }
  return true;
}

export default function CreateVisualisationPreview({ visualisation, datasets }) {
  return (
    <div className="VisualisationPreview">
      {shouldRender(visualisation, datasets) ?
        <VisualisationViewer
          visualisation={visualisation}
          datasets={datasets}
        /> :
        null
      }
    </div>
  );
}

CreateVisualisationPreview.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

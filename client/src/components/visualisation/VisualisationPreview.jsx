import React, { PropTypes } from 'react';
import DashChart from '../charts/DashChart';

require('../../styles/VisualisationPreview.scss');


function shouldRender(visualisation, datasets) {
  const datasetId = visualisation.datasetId;
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
  const haveDataColumn = spec.datasetColumnX != null;
  if (!haveDataColumn) {
    return false;
  }
  const needSecondDataColumn = visualisationType === 'scatter' || visualisationType === 'map';
  const haveSecondDataColumn = spec.datasetColumnY != null;
  console.log(spec);
  if (needSecondDataColumn && !haveSecondDataColumn) {
    return false;
  }
  return true;
}

export default function CreateVisualisationPreview({ visualisation, datasets }) {
  return (
    <div className="VisualisationPreview">
      {shouldRender(visualisation, datasets) ?
        <DashChart
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

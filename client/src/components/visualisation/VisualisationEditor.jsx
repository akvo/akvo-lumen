import React, { PropTypes } from 'react';
import VisualisationConfig from './VisualisationConfig';
import VisualisationPreview from './VisualisationPreview';
import * as api from '../../api';

require('../../styles/VisualisationEditor.scss');

export default function VisualisationEditor(props) {
  const { visualisation } = props;

  if (visualisation.visualisationType === 'pivot table' && visualisation.datasetId) {
    api.get(`/api/pivot/${props.visualisation.datasetId}`, {
      query: JSON.stringify(visualisation.spec),
    }).then(response => console.log(response));
  }

  return (
    <div className="VisualisationEditor">
      <VisualisationConfig
        visualisation={props.visualisation}
        datasets={props.datasets}
        onChangeVisualisationType={props.onChangeVisualisationType}
        onChangeSourceDataset={props.onChangeSourceDataset}
        onChangeVisualisationSpec={props.onChangeVisualisationSpec}
        onSaveVisualisation={props.onSaveVisualisation}
      />
      <VisualisationPreview
        visualisation={props.visualisation}
        datasets={props.datasets}
      />
    </div>
  );
}

VisualisationEditor.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
};

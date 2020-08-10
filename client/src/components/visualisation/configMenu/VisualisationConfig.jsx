import React from 'react';
import PropTypes from 'prop-types';
import ConfigMenu from './ConfigMenu';

require('./VisualisationConfig.scss');

export default function VisualisationConfig(props) {
  const vType = props.visualisation.visualisationType ?
    props.visualisation.visualisationType : 'noVisualisationType';

  return (
    <div className={`VisualisationConfig ${vType}`}>
      <ConfigMenu
        visualisation={props.visualisation}
        metadata={props.metadata}
        datasets={props.datasets}
        rasters={props.rasters}
        onChangeSourceDataset={props.onChangeSourceDataset}
        onChangeVisualisationSpec={props.onChangeVisualisationSpec}
        onChangeVisualisationType={props.onChangeVisualisationType}
        onSaveVisualisation={props.onSaveVisualisation}
        loadDataset={props.loadDataset}
        env={props.env}
      />
    </div>
  );
}

VisualisationConfig.propTypes = {
  visualisation: PropTypes.object.isRequired,
  env: PropTypes.object.isRequired,
  metadata: PropTypes.object,
  datasets: PropTypes.object.isRequired,
  rasters: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeVisualisationSpec: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
  loadDataset: PropTypes.func.isRequired,
};

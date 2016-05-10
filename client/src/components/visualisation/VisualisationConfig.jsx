import React, { PropTypes } from 'react';
import VisualisationTypeMenu from './VisualisationTypeMenu';
import ConfigMenu from './ConfigMenu';

require('../../styles/VisualisationConfig.scss');

const getConfigMenu = (chartType, componentProps) => {
  const configMenu = (
    <ConfigMenu
      visualisation={componentProps.visualisation}
      datasets={componentProps.datasets}
      onChangeTitle={componentProps.onChangeTitle}
      onChangeSourceDataset={componentProps.onChangeSourceDataset}
      onChangeDatasetColumnX={componentProps.onChangeDatasetColumnX}
      onChangeDatasetColumnY={componentProps.onChangeDatasetColumnY}
      onChangeDatasetNameColumnX={componentProps.onChangeDatasetNameColumnX}
      onChangeDatasetLabelX={componentProps.onChangeDatasetLabelX}
      onChangeDatasetLabelY={componentProps.onChangeDatasetLabelY}
    />
  );

  return configMenu;
};

export default function VisualisationConfig(props) {
  const visualisation = props.visualisation;
  const configMenu = getConfigMenu(visualisation.visualisationType, props);

  return (
    <div className="VisualisationConfig">
      <h3 className="title">Configure Visualisation</h3>
      <VisualisationTypeMenu
        onChangeVisualisationType={props.onChangeVisualisationType}
        visualisation={visualisation}
      />
      {visualisation.visualisationType &&
        configMenu
      }
      {visualisation.visualisationType &&
        <button
          className="saveChanges clickable"
          onClick={props.onSaveDataset}
        >
          Save changes
        </button>
      }
    </div>
  );
}

VisualisationConfig.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDataset: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetNameColumnX: PropTypes.func.isRequired,
  onChangeDatasetColumnY: PropTypes.func.isRequired,
  onChangeDatasetLabelX: PropTypes.func.isRequired,
  onChangeDatasetLabelY: PropTypes.func.isRequired,
  onSaveDataset: PropTypes.func.isRequired,
};

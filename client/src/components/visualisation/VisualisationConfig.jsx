import React, { Component, PropTypes } from 'react';
import VisualisationTypeMenu from './VisualisationTypeMenu';
import OneAxisConfigMenu from './configMenu/OneAxisConfigMenu';
import TwoAxisConfigMenu from './configMenu/TwoAxisConfigMenu';
import PieConfigMenu from './configMenu/PieConfigMenu';

require('../../styles/VisualisationConfig.scss');

const getConfigMenu = (chartType, componentProps) => {
  if (chartType === 'bar' || chartType === 'line' || chartType === 'area') {
    return (
      <OneAxisConfigMenu
        visualisation={componentProps.visualisation}
        datasets={componentProps.datasets}
        onChangeTitle={componentProps.onChangeTitle}
        onChangeSourceDatasetX={componentProps.onChangeSourceDatasetX}
        onChangeDatasetColumnX={componentProps.onChangeDatasetColumnX}
        onChangeDatasetNameColumnX={componentProps.onChangeDatasetNameColumnX}
        onChangeDatasetLabelX={componentProps.onChangeDatasetLabelX}
        onChangeDatasetLabelY={componentProps.onChangeDatasetLabelY}
      />
    );
  }
  if (chartType === 'pie' || chartType === 'donut') {
    return (
      <PieConfigMenu
        visualisation={componentProps.visualisation}
        datasets={componentProps.datasets}
        onChangeTitle={componentProps.onChangeTitle}
        onChangeSourceDatasetX={componentProps.onChangeSourceDatasetX}
        onChangeDatasetColumnX={componentProps.onChangeDatasetColumnX}
      />
    );
  }
  if (chartType === 'scatter') {
    return (
      <TwoAxisConfigMenu
        visualisation={componentProps.visualisation}
        datasets={componentProps.datasets}
        onChangeTitle={componentProps.onChangeTitle}
        onChangeSourceDatasetX={componentProps.onChangeSourceDatasetX}
        onChangeSourceDatasetY={componentProps.onChangeSourceDatasetY}
        onChangeDatasetColumnX={componentProps.onChangeDatasetColumnX}
        onChangeDatasetColumnY={componentProps.onChangeDatasetColumnY}
        onChangeDatasetLabelX={componentProps.onChangeDatasetLabelX}
        onChangeDatasetLabelY={componentProps.onChangeDatasetLabelY}
      />
    );
  }
};

export default class VisualisationConfig extends Component {

  render() {
    const visualisation = this.props.visualisation;
    const configMenu = getConfigMenu(visualisation.visualisationType, this.props);

    return (
      <div className="VisualisationConfig">
        <h3 className="title">Configure Visualisation</h3>
        <VisualisationTypeMenu
          onChangeVisualisationType={this.props.onChangeVisualisationType}
          visualisation={visualisation}
        />
        {visualisation.visualisationType &&
          configMenu
        }
        {visualisation.visualisationType &&
          <button
            className="saveChanges clickable"
            onClick={this.props.onSaveDataset}
          >
            Save changes
          </button>
        }
      </div>
    );
  }
}

VisualisationConfig.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDatasetX: PropTypes.func.isRequired,
  onChangeSourceDatasetY: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetNameColumnX: PropTypes.func.isRequired,
  onChangeDatasetColumnY: PropTypes.func.isRequired,
  onChangeDatasetLabelX: PropTypes.func.isRequired,
  onChangeDatasetLabelY: PropTypes.func.isRequired,
  onSaveDataset: PropTypes.func.isRequired,
};

import React, { Component, PropTypes } from 'react';
import EditVisualisationTypeMenu from './EditVisualisationTypeMenu';
import OneAxisConfigMenu from './configMenu/OneAxisConfigMenu';
import TwoAxisConfigMenu from './configMenu/TwoAxisConfigMenu';
import PieConfigMenu from './configMenu/PieConfigMenu';

require('../../styles/EditVisualisationConfig.scss');

const getConfigMenu = (chartType, componentProps) => {
  if (chartType === 'bar' || chartType === 'line') {
    return (
      <OneAxisConfigMenu
        visualisation={componentProps.visualisation}
        datasets={componentProps.datasets}
        onChangeTitle={componentProps.onChangeTitle}
        onChangeSourceDatasetX={componentProps.onChangeSourceDatasetX}
        onChangeDatasetColumnX={componentProps.onChangeDatasetColumnX}
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

export default class EditVisualisationConfig extends Component {

  render() {
    const visualisation = this.props.visualisation;
    const configMenu = getConfigMenu(visualisation.visualisationType, this.props);

    return (
      <div className="EditVisualisationConfig">
        <h3 className="title">Configure Visualisation</h3>
        <EditVisualisationTypeMenu
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

EditVisualisationConfig.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  onChangeSourceDatasetX: PropTypes.func.isRequired,
  onChangeSourceDatasetY: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetColumnY: PropTypes.func.isRequired,
  onChangeDatasetLabelX: PropTypes.func.isRequired,
  onChangeDatasetLabelY: PropTypes.func.isRequired,
  onSaveDataset: PropTypes.func.isRequired,
};

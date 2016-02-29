import React, { Component, PropTypes } from 'react';
import DashSelect from '../../common/DashSelect';

const getDatasetArray = datasetObject => {
  const datasetArray = [];
  const sortFunction = (a, b) => a.name.toLowerCase() > b.name.toLowerCase();

  Object.keys(datasetObject).forEach(key => {
    datasetArray.push(datasetObject[key]);
  });

  datasetArray.sort(sortFunction);

  return datasetArray;
};

const getDatasetOptions = (datasetArray) => {
  let output = [];

  datasetArray.forEach(option => {
    output.push({
      value: option.id, label: option.name,
    });
  });

  return output;
};

const getDashSelectOptionsFromColumnArray = (array) => {
  let output = [];

  if (array) {
    array.forEach((entry, index) => {
      output.push({
        value: index, label: entry.title,
      });
    });
  }
  return output;
};

export default class OneAxisConfigMenu extends Component {
  render() {
    const datasetArray = getDatasetArray(this.props.datasets);
    const visualisation = this.props.visualisation;
    let xColumns = [];

    if (this.props.datasets[visualisation.sourceDatasetX]) {
      xColumns = this.props.datasets[visualisation.sourceDatasetX].columns || [];
    }

    const datasetOptions = getDatasetOptions(datasetArray);
    const columnOptionsX = getDashSelectOptionsFromColumnArray(xColumns);

    return (
      <div className="OneAxisConfigMenu">
        <div className="inputGroup">
          <label htmlFor="chartTitle">Chart title:</label>
          <input
            className="textInput"
            type="text"
            id="chartTitle"
            placeholder="Untitled chart"
            defaultValue={visualisation.name}
            onChange={this.props.onChangeTitle}
          />
        </div>
        <h3>X-Axis</h3>
        <div className="inputGroup">
          <label htmlFor="xDatasetMenu">Source dataset:</label>
          <DashSelect
            name="xDatasetMenu"
            value={visualisation.sourceDatasetX || "Choose a dataset option..."}
            options={datasetOptions}
            onChange={this.props.onChangeSourceDatasetX}
          />
        </div>
        <div className="inputGroup">
          <label htmlFor="xColumnMenu">Dataset column:</label>
          <DashSelect
            name="xColumnMenu"
            value={visualisation.datasetColumnX || "Choose a dataset column..."}
            options={columnOptionsX}
            onChange={this.props.onChangeDatasetColumnX}
          />
        </div>
        {visualisation.visualisationType === 'bar' &&
          <div className="inputGroup">
            <label htmlFor="xNameColumnMenu">Label column:</label>
            <DashSelect
              name="xNameColumnMenu"
              disabled={xColumns.length === 0}
              value={visualisation.datasetNameColumnX || "Choose a name column..."}
              onChange={this.props.onChangeDatasetNameColumnX}
              options={columnOptionsX}
            />
          </div>
        }
        <div className="inputGroup">
          <label htmlFor="xLabel">X Axis Label:</label>
          <input
            className="textInput"
            type="text"
            placeholder="X Axis label"
            defaultValue={visualisation.labelX}
            onChange={this.props.onChangeDatasetLabelX}
          />
        </div>

        <h3>Y-Axis</h3>
        <div className="inputGroup">
          <label htmlFor="xLabel">Y Axis Label:</label>
          <input
            className="textInput"
            type="text"
            placeholder="Y Axis label"
            defaultValue={visualisation.labelY}
            onChange={this.props.onChangeDatasetLabelY}
          />
        </div>
      </div>
    );
  }
}

OneAxisConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeSourceDatasetX: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetNameColumnX: PropTypes.func.isRequired,
  onChangeDatasetLabelX: PropTypes.func.isRequired,
  onChangeDatasetLabelY: PropTypes.func.isRequired,
};

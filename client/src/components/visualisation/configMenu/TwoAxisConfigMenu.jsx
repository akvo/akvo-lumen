import React, { Component, PropTypes } from 'react';

const getDatasetArray = datasetObject => {
  const datasetArray = [];
  const sortFunction = (a, b) => a.name.toLowerCase() > b.name.toLowerCase();

  Object.keys(datasetObject).map(key => {
    datasetArray.push(datasetObject[key]);
  });

  datasetArray.sort(sortFunction);

  return datasetArray;
};

export default class TwoAxisConfigMenu extends Component {
  render() {
    const datasetArray = getDatasetArray(this.props.datasets);
    const visualisation = this.props.visualisation;
    let xColumns = [];
    let yColumns = [];

    if (this.props.datasets[visualisation.sourceDatasetX]) {
      xColumns = this.props.datasets[visualisation.sourceDatasetX].columns || [];
    }

    if (this.props.datasets[visualisation.sourceDatasetY]) {
      yColumns = this.props.datasets[visualisation.sourceDatasetY].columns || [];
    }

    return (
      <div className="TwoAxisConfigMenu">
        <div className="inputGroup">
          <label htmlFor="chartTitle">Chart title:</label>
          <input
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
          <select
            id="xDatasetMenu"
            defaultValue={visualisation.sourceDatasetX}
            onChange={this.props.onChangeSourceDatasetX}
          >
            {datasetArray.map((dataset, index) =>
              <option
                key={index}
                value={dataset.id}
              >
                {dataset.name}
              </option>
            )}
          </select>
        </div>
        <div className="inputGroup">
          <label htmlFor="xColumnMenu">Dataset column:</label>
          <select
            id="xColumnMenu"
            disabled={xColumns.length === 0}
            defaultValue={visualisation.datasetColumnX}
            onChange={this.props.onChangeDatasetColumnX}
          >
            {visualisation.sourceDatasetX &&
              xColumns.map((column, index) =>
                <option key={index} value={index}>{column.title}</option>
              )
            }
          </select>
        </div>
        <div className="inputGroup">
          <label htmlFor="xLabel">X Axis Label:</label>
          <input
            type="text"
            placeholder="X Axis label"
            defaultValue={visualisation.labelX}
            onChange={this.props.onChangeDatasetLabelX}
          />
        </div>

        <h3>Y-Axis</h3>
        <div className="inputGroup">
          <label htmlFor="yDatasetMenu">Source dataset:</label>
          <select
            id="yDatasetMenu"
            defaultValue={visualisation.sourceDatasetY}
            onChange={this.props.onChangeSourceDatasetY}
          >
            {datasetArray.map((dataset, index) =>
              <option
                key={index}
                value={dataset.id}
              >
                {dataset.name}
              </option>
            )}
          </select>
        </div>
        <div className="inputGroup">
          <label htmlFor="yColumnMenu">Dataset column:</label>
          <select
            id="yColumnMenu"
            disabled={yColumns.length === 0}
            defaultValue={visualisation.datasetColumnY}
            onChange={this.props.onChangeDatasetColumnY}
          >
            {visualisation.sourceDatasetY &&
              yColumns.map((column, index) =>
                <option key={index} value={index}>{column.title}</option>
              )
            }
          </select>
        </div>
        <div className="inputGroup">
          <label htmlFor="yLabel">Y Axis Label:</label>
          <input
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

TwoAxisConfigMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onChangeSourceDatasetX: PropTypes.func.isRequired,
  onChangeSourceDatasetY: PropTypes.func.isRequired,
  onChangeDatasetColumnX: PropTypes.func.isRequired,
  onChangeDatasetColumnY: PropTypes.func.isRequired,
  onChangeDatasetLabelX: PropTypes.func.isRequired,
  onChangeDatasetLabelY: PropTypes.func.isRequired,
};

import React, { Component, PropTypes } from 'react';

require('../../styles/VisualisationTypeMenu.scss');

export default class VisualisationTypeMenu extends Component {

  render() {
    const chartTypes = ['bar', 'line', 'area', 'pie', 'donut', 'scatter'];

    return (
      <div className="VisualisationTypeMenu">
        <label htmlFor="visualisationTypeMenu">
          Visualisation type:
        </label>
        <select
          id="visualisationTypeMenu"
          onChange={this.props.onChangeVisualisationType}
          defaultValue={this.props.visualisation.visualisationType || 'placeholder'}
        >
          <option value="placeholder" disabled>
            Choose chart type:
          </option>
          {chartTypes.map((chartType, index) =>
            <option key={index} value={chartType}>{chartType}</option>
          )}
        </select>
      </div>
    );
  }
}

VisualisationTypeMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
};

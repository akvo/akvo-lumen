import React, { Component, PropTypes } from 'react';

require('../../styles/EditVisualisationTypeMenu.scss');

export default class EditVisualisationTypeMenu extends Component {

  render() {
    const chartTypes = ['bar', 'line', 'area', 'pie', 'donut', 'scatter'];

    return (
      <div className="EditVisualisationTypeMenu">
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

EditVisualisationTypeMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
};

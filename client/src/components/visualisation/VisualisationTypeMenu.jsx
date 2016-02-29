import React, { Component, PropTypes } from 'react';
import DashSelect from '../common/DashSelect';

require('../../styles/VisualisationTypeMenu.scss');

export default class VisualisationTypeMenu extends Component {

  render() {
    const chartTypes = [
      { value: 'bar', label: 'bar' },
      { value: 'line', label: 'line' },
      { value: 'area', label: 'area' },
      { value: 'pie', label: 'pie' },
      { value: 'donut', label: 'donut' },
      { value: 'scatter', label: 'scatter' },
    ];

    return (
      <div className="VisualisationTypeMenu">
        <label htmlFor="visualisationTypeMenu">
          Visualisation type:
        </label>
        <DashSelect
          name="visualisationTypeMenu"
          value={this.props.visualisation.visualisationType || 'Choose a visualisation type...'}
          options={chartTypes}
          onChange={this.props.onChangeVisualisationType}
        />
      </div>
    );
  }
}

VisualisationTypeMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
};

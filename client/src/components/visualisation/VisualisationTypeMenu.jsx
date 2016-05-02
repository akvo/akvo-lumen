import React, { PropTypes } from 'react';
import DashSelect from '../common/DashSelect';

require('../../styles/VisualisationTypeMenu.scss');

export default function VisualisationTypeMenu({ visualisation, onChangeVisualisationType }) {
  const chartTypes = [
    { value: 'bar', label: 'bar' },
    { value: 'line', label: 'line' },
    { value: 'area', label: 'area' },
    { value: 'pie', label: 'pie' },
    { value: 'donut', label: 'donut' },
    { value: 'scatter', label: 'scatter' },
    { value: 'map', label: 'map'},
  ];

  return (
    <div className="VisualisationTypeMenu">
      <label htmlFor="visualisationTypeMenu">
        Visualisation type:
      </label>
      <DashSelect
        name="visualisationTypeMenu"
        value={visualisation.visualisationType || 'Choose a visualisation type...'}
        options={chartTypes}
        onChange={onChangeVisualisationType}
      />
    </div>
  );
}

VisualisationTypeMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
};

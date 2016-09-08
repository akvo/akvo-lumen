import React, { PropTypes } from 'react';
import SelectMenu from '../common/SelectMenu';

require('../../styles/VisualisationTypeMenu.scss');

export default function VisualisationTypeMenu({ visualisation, onChangeVisualisationType }) {
  const chartTypes = [
    { value: 'bar', label: 'bar' },
    { value: 'line', label: 'line' },
    { value: 'area', label: 'area' },
    { value: 'pie', label: 'pie' },
    { value: 'donut', label: 'donut' },
    { value: 'scatter', label: 'scatter' },
    { value: 'map', label: 'map' },
  ];

  return (
    <div className="VisualisationTypeMenu">
      <label htmlFor="visualisationTypeMenu">
        Visualisation type:
      </label>
      <SelectMenu
        name="visualisationTypeMenu"
        placeholder="Choose a visualisation type..."
        value={visualisation.visualisationType}
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

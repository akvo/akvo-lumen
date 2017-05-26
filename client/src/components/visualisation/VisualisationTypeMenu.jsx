import React from 'react';
import PropTypes from 'prop-types';
import SelectMenu from '../common/SelectMenu';
import visualisationTypes from '../../containers/Visualisation/visualisationTypes';

require('../../styles/VisualisationTypeMenu.scss');

export default function VisualisationTypeMenu(props) {
  const { visualisation, onChangeVisualisationType, disabled } = props;
  const chartTypes = visualisationTypes.map(item => ({
    value: item,
    label: item,
  }));
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
        disabled={disabled}
      />
    </div>
  );
}

VisualisationTypeMenu.propTypes = {
  visualisation: PropTypes.object.isRequired,
  onChangeVisualisationType: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired,
};

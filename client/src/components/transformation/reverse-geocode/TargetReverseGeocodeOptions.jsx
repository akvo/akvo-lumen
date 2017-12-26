import React from 'react';
import PropTypes from 'prop-types';
import SelectColumn from '../SelectColumn';

import './TargetReverseGeocodeOptions.scss';

export default function TargetReverseGeocodeOptions({ spec, onChangeSpec, dataset }) {
  return (
    <div className="TargetReverseGeocodeOptions">
      <h1>Dataset</h1>
      <p>{dataset.get('name')} ({dataset.get('columns').size} columns)</p>
      <h1>Geopoint column</h1>
      <SelectColumn
        columns={dataset.get('columns').filter(column => column.get('type') === 'geopoint')}
        onChange={column => onChangeSpec(spec.setIn(['target', 'geopointColumn'], column))}
        value={spec.getIn(['target', 'geopointColumn'])}
      />
    </div>
  );
}

TargetReverseGeocodeOptions.propTypes = {
  dataset: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

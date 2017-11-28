import React from 'react';
import PropTypes from 'prop-types';
import SelectColumn from '../SelectColumn';

import './TargetReverseGeocodeOptions.scss';

export default function TargetReverseGeocodeOptions({ spec, onChangeSpec, dataset }) {
  return (
    <div className="TargetReverseGeocodeOptions">
      <h1>Geopoint column</h1>
      <SelectColumn
        columns={dataset.get('columns').filter(column => column.get('type') === 'geopoint')}
        onChange={column => onChangeSpec(spec.setIn(['target', 'geopointColumn'], column))}
        value={spec.getIn(['target', 'geopointColumn'])}
      />
      <h1>New column title</h1>
      <input
        type="text"
        onChange={evt => onChangeSpec(spec.setIn(['target', 'title'], evt.target.value))}
        value={spec.getIn(['target', 'title'])}
      />
    </div>
  );
}

TargetReverseGeocodeOptions.propTypes = {
  dataset: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import SelectMenu from '../../common/SelectMenu';
import { filterColumns, columnSelectOptions, columnSelectSelectedOption } from '../../../utilities/column';

import './TargetReverseGeocodeOptions.scss';

export default function TargetReverseGeocodeOptions({ spec, onChangeSpec, dataset, intl }) {
  const columns = filterColumns(dataset.get('columns'), ['geopoint']);
  return (
    <div className="TargetReverseGeocodeOptions">
      <h1>Dataset</h1>
      <p>{dataset.get('name')} ({dataset.get('columns').size} columns)</p>
      <h1>Geopoint column</h1>
      <SelectMenu
        options={columnSelectOptions(intl, columns)}
        onChange={column => onChangeSpec(spec.setIn(['target', 'geopointColumn'], column))}
        value={columnSelectSelectedOption(spec.getIn(['target', 'geopointColumn']), columns)}
      />
    </div>
  );
}

TargetReverseGeocodeOptions.propTypes = {
  dataset: PropTypes.object.isRequired,
  spec: PropTypes.object.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
  intl: intlShape,
};

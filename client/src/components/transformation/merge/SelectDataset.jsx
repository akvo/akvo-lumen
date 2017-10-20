import React from 'react';
import PropTypes from 'prop-types';
import SelectMenu from '../../common/SelectMenu';

function options(datasets) {
  return Object.keys(datasets).map(datasetId => ({
    label: datasets[datasetId].get('name'),
    value: datasetId,
  })).slice().sort((a, b) => a.label.localeCompare(b.label));
}

export default function SelectDataset({ datasets, value, onChange, placeholder = 'Select dataset' }) {
  return (
    <SelectMenu
      placeholder={placeholder}
      options={options(datasets)}
      value={value == null ? null : value.get('id')}
      onChange={datasetId => onChange(datasets[datasetId])}
    />
  );
}

SelectDataset.propTypes = {
  datasets: PropTypes.object.isRequired,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

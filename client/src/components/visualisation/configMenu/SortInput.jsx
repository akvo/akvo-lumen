import React from 'react';
import PropTypes from 'prop-types';
import SelectInput from './SelectInput';

export default function SortInput({ spec, onChangeSpec }) {
  return (
    <div>
      <SelectInput
        placeholder="Choose a sort direction..."
        labelText="Sort"
        value={spec.sort !== null ? spec.sort.toString() : null}
        name="sortInput"
        options={[
          {
            value: 'asc',
            label: 'Ascending',
          },
          {
            value: 'dsc',
            label: 'Descending',
          },
        ]}
        clearable
        onChange={value => onChangeSpec({
          sort: value,
        })}
      />
    </div>
  );
}

SortInput.propTypes = {
  spec: PropTypes.object.isRequired,
  columnOptions: PropTypes.array.isRequired,
  onChangeSpec: PropTypes.func.isRequired,
};

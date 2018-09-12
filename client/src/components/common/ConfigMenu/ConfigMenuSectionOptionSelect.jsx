import React from 'react';
import PropTypes from 'prop-types';

import SelectMenu from '../SelectMenu';
import ConfigMenuSectionOption from './ConfigMenuSectionOption';

const ConfigMenuOptionSelect = ({
  value,
  options,
  onChange,
  placeholderId,
  name,
  labelTextId,
  testId,
}) => (
  <ConfigMenuSectionOption
    labelTextId={labelTextId}
    testId={testId}
  >
    <div data-test-id="dataset-menu">
      <SelectMenu
        name={name}
        placeholderId={placeholderId}
        value={value}
        options={options}
        onChange={onChange}
      />
    </div>
  </ConfigMenuSectionOption>
);

ConfigMenuOptionSelect.propTypes = {
  options: PropTypes.array.isRequired,
  value: PropTypes.string,
  name: PropTypes.string,
  labelTextId: PropTypes.string,
  testId: PropTypes.string,
  placeholderId: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export default ConfigMenuOptionSelect;

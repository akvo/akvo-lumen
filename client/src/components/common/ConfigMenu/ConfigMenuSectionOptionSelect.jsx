import React from 'react';
import PropTypes from 'prop-types';

import SelectMenu from '../SelectMenu';
import ConfigMenuSectionOption from './ConfigMenuSectionOption';

const ConfigMenuOptionSelect = ({
  labelTextId,
  testId,
  ...rest
}) => (
  <ConfigMenuSectionOption
    labelTextId={labelTextId}
    testId={testId}
  >
    <SelectMenu {...rest} />
  </ConfigMenuSectionOption>
);

ConfigMenuOptionSelect.propTypes = {
  labelTextId: PropTypes.string,
  testId: PropTypes.string,
};

export default ConfigMenuOptionSelect;

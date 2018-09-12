import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

const ConfigMenuSectionOption = ({
  labelTextId,
  testId,
  children,
}) => (
  <div
    className="inputGroup"
    data-test-id={testId}
  >
    {labelTextId && (
      <label htmlFor="xDatasetMenu">
        <FormattedMessage id={labelTextId} />:
      </label>
    )}
    {children}
  </div>
);

ConfigMenuSectionOption.propTypes = {
  labelTextId: PropTypes.string,
  testId: PropTypes.string,
  children: PropTypes.node,
};

export default ConfigMenuSectionOption;

import React from 'react';
import PropTypes from 'prop-types';

const Alert = ({ success, danger, warning, children }) => (
  <div
    className={`alert ${
      success ? 'alert-success' : ''
    } ${
      danger ? 'alert-danger' : ''
    } ${
      warning ? 'alert-warning' : ''
    }`}
  >
    {children}
  </div>
);

Alert.propTypes = {
  success: PropTypes.bool,
  danger: PropTypes.bool,
  warning: PropTypes.bool,
  children: PropTypes.node,
};

export default Alert;

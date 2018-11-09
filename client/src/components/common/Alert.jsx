import React from 'react';

export default ({ success, danger, warning, children }) => (
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


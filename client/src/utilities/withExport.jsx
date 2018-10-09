import React from 'react';

export default WrappedComponent => props => (
  <WrappedComponent exporting {...props} />
);

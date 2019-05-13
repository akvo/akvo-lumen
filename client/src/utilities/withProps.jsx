import React from 'react';

export default (WrappedComponent, withProps) => props => (
  <WrappedComponent {...withProps} {...props} />
);

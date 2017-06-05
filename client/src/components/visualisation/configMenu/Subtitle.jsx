import React from 'react';
import PropTypes from 'prop-types';

export default function Subtitle({ children }) {
  return (
    <h3 className="subtitle">{children}</h3>
  );
}

Subtitle.propTypes = {
  children: PropTypes.node.isRequired,
};

import React, { PropTypes } from 'react';

export default function Subtitle({ children }) {
  return (
    <h3 className="subtitle">{children}</h3>
  );
}

Subtitle.propTypes = {
  children: PropTypes.node.isRequired,
};

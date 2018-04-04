import React from 'react';
import PropTypes from 'prop-types';

const LegendShape = ({ isActive, width = 15, height = 15, fill }) => (
  <svg width={width} height={height}>
    <circle
      r={width * (isActive ? 0.5 : 0.4)}
      cx={width / 2}
      cy={height / 2}
      fill={fill}
    />
  </svg>
);

LegendShape.propTypes = {
  isActive: PropTypes.bool,
  width: PropTypes.number,
  height: PropTypes.number,
  fill: PropTypes.string,
};

export default LegendShape;

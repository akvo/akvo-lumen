import React from 'react';
import PropTypes from 'prop-types';
import SwatchesPicker from 'react-color/lib/components/swatches/Swatches';
import Popover from './Popover';

import './ColorPicker.scss';
import LegendShape from './charts/LegendShape';

const ColorPicker = ({ title, target, left = 0, top = 0, placement, style, ...rest }) => (
  <Popover
    target={target}
    left={left}
    top={top}
    placement={placement}
    className="color-picker-popover"
    style={style}
    title={(
      <span>
        {rest.color && <LegendShape fill={rest.color} isActive />}
        {title}
      </span>
    )}
  >
    <div className="color-picker">
      <SwatchesPicker {...rest} />
    </div>
  </Popover>
);

ColorPicker.propTypes = {
  target: PropTypes.node,
  isOpen: PropTypes.bool,
  title: PropTypes.string,
  placement: PropTypes.string,
  left: PropTypes.number,
  top: PropTypes.number,
  style: PropTypes.object,
};

export default ColorPicker;

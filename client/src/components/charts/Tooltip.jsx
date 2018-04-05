import React from 'react';
import PropTypes from 'prop-types';

import LegendShape from './LegendShape';
import './Tooltip.scss';

const Tooltip = ({ items, ...rest }) => (items.length ? (
  <div className="tooltip" style={{ position: 'absolute', ...rest }}>
    <ul>
      {items.map(({ color, key, value }, i) => (
        <li key={key || i}>
          {color && <LegendShape isActive={false} fill={color} />}
          <span className="key">{key}</span>
          {value && `: ${value}`}
        </li>
      ))}
    </ul>
  </div>
) : null);

Tooltip.propTypes = {
  items: PropTypes.array,
  children: PropTypes.func.isRequired,
};

export default Tooltip;

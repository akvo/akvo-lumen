import React from 'react';
import PropTypes from 'prop-types';
import itsSet from 'its-set';

import { replaceLabelIfValueEmpty } from '../../utilities/chart';
import LegendShape from './LegendShape';
import './Tooltip.scss';

const Tooltip = ({ items, ...rest }) => (items.length ? (
  <div className="tooltip" style={{ position: 'absolute', ...rest }}>
    <ul>
      {items.map(({ color, key, value }, i) => {
        const label = replaceLabelIfValueEmpty(key);
        return (
          <li key={label || i}>
            {color && <LegendShape isActive={false} fill={color} />}
            <span className="key">{label}</span>
            {itsSet(value) && `: ${value}`}
          </li>
        );
      })}
    </ul>
  </div>
) : null);

Tooltip.propTypes = {
  items: PropTypes.array,
};

export default Tooltip;

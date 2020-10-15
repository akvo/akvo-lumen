import React from 'react';
import PropTypes from 'prop-types';
import itsSet from 'its-set';

import { replaceLabelIfValueEmpty } from '../../utilities/chart';
import LegendShape from './LegendShape';
import './Tooltip.scss';

const Tooltip = ({ items, ...rest }) => (items.length ? (
  <div className="chart-tooltip" style={{ position: 'absolute', ...rest }}>
    <ul>
      {items.map(({ color, key, value }) => {
        const hasKey = Boolean(itsSet(key) && key.length);
        return (
          <li key={replaceLabelIfValueEmpty(key)}>
            {color && <LegendShape isActive={false} fill={color} />}
            {hasKey && <span className="key">{key}</span>}
            {(itsSet(value) && hasKey) && ': '}
            {itsSet(value) && `${value}`}
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

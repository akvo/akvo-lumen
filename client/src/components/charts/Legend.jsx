import React from 'react';
import PropTypes from 'prop-types';
import { isString } from 'lodash';
import { LegendOrdinal } from '@vx/legend';
import { scaleOrdinal } from '@vx/scale';

import './Legend.scss';
import LegendShape from './LegendShape';

const Legend = ({
  data,
  title,
  description,
  horizontal = false,
  activeItem,
  colorMapping = {},
  ...rest
}) => {
  const ordinalColor = scaleOrdinal({ domain: data, range: [] });
  return (
    <div className={`legend ${horizontal ? 'legend-horizontal' : ''}`}>
      {description && (isString(description) ? (
        <p className="legend-description">{description}</p>
      ) : description)}
      {description && isString(description) && <p className="legend-description">{description}</p>}
      {title && <h4>{title}</h4>}
      <LegendOrdinal
        {...rest}
        shapeMargin="0"
        labelMargin="0 0 0 4px"
        itemMargin="0 5px"
        scale={ordinalColor}
        shape={({ label: { datum }, ...shapeRest }) => (
          <LegendShape isActive={activeItem === datum} {...shapeRest} />
        )}
        fill={({ datum }) => colorMapping[datum]}
      />
    </div>
  );
};

Legend.propTypes = {
  data: PropTypes.array.isRequired,
  colorMapping: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  horizontal: PropTypes.bool,
  title: PropTypes.string,
  description: PropTypes.string,
  activeItem: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};

export default Legend;

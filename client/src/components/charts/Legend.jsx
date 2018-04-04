import React from 'react';
import PropTypes from 'prop-types';
import { LegendOrdinal } from '@vx/legend';
import { scaleOrdinal } from '@vx/scale';

import './Legend.scss';
import LegendShape from './LegendShape';

const Legend = ({
  data,
  colors,
  title,
  horizontal = false,
  activeItem,
  ...rest
}) => {
  const ordinalColor = scaleOrdinal({ domain: data, range: [] });
  return (
    <div className={`legend ${horizontal ? 'legend-horizontal' : ''}`}>
      {title && <h4>{title}</h4>}
      <LegendOrdinal
        {...rest}
        // direction={horizontal ? 'row' : undefined}
        // itemDirection={horizontal ? 'row' : undefined}
        shapeMargin="0"
        labelMargin="0 0 0 4px"
        itemMargin="0 5px"
        scale={ordinalColor}
        shape={({ label: { datum }, ...shapeRest }) => (
          <LegendShape isActive={activeItem === datum} {...shapeRest} />
        )}
        fill={({ datum }) => colors[datum]}
        // onMouseOver={data => event => {
        //   console.log(
        //     `mouse over: ${data.text}`,
        //     `index: ${data.index}`,
        //   );
        // }}
      />
    </div>
  );
};

Legend.propTypes = {
  data: PropTypes.arrayOf(PropTypes.string),
  colors: PropTypes.object.isRequired,
  onClick: PropTypes.func,
  horizontal: PropTypes.bool,
  title: PropTypes.string,
  activeItem: PropTypes.string,
};

export default Legend;

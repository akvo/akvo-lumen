import React from 'react';
import PropTypes from 'prop-types';

const calculateDimensions = ({ width, height, legendVisible, legendPosition }) => {
  if (!legendVisible) {
    return { horizontal: true, chart: width };
  }
  const dimensions = {};
  switch (legendPosition) {

    case 'right': {
      dimensions.horizontal = true;
      dimensions.chartBeforeLegend = true;
      if (width >= 600) {
        dimensions.legend = 250;
      } else if (width >= 400) {
        dimensions.legend = 200;
      }
      if (width < 400) {
        dimensions.legend = width / 2;
      }
      dimensions.chart = width - dimensions.legend;
      break;
    }

    default : {
      dimensions.horizontal = width > height;
      dimensions.chartBeforeLegend = true;
      const biggerDimension = Math.max(width, height);
      if (biggerDimension >= 600) {
        dimensions.legend = dimensions.horizontal ? 250 : 150;
      } else if (biggerDimension >= 400) {
        dimensions.legend = dimensions.horizontal ? 200 : 150;
      }
      if (biggerDimension < 400) {
        dimensions.legend = biggerDimension / 2;
      }
      dimensions.chart = biggerDimension - dimensions.legend;
      break;
    }

  }
  return dimensions;
};

const ChartLayout = ({
  legendVisible,
  legend = () => null,
  width,
  height,
  chart,
  children,
  legendPosition,
  style = {},
  ...rest
}) => {
  const dimensions = calculateDimensions({ width, height, legendVisible, legendPosition });
  return dimensions.horizontal ? (
    <div style={{ display: 'flex', height, width, ...style }} {...rest}>
      {children}
      {dimensions.chartBeforeLegend && (
        <div style={{ height, width: dimensions.chart }}>
          {chart}
        </div>
      )}
      {legendVisible && (
        <div style={{ height, width: dimensions.legend }}>
          {legend(dimensions)}
        </div>
      )}
      {!dimensions.chartBeforeLegend && (
        <div style={{ height, width: dimensions.chart }}>
          {chart}
        </div>
      )}
    </div>
  ) : (
    <div style={{ height, width }} {...rest}>
      {children}
      {dimensions.chartBeforeLegend && (
        <div style={{ height: dimensions.chart, width }}>
          {chart}
        </div>
      )}
      {legendVisible && (
        <div style={{ width, height: dimensions.legend }}>
          {legend(dimensions)}
        </div>
      )}
      {!dimensions.chartBeforeLegend && (
        <div style={{ width, height: dimensions.chart }}>
          {chart}
        </div>
      )}
    </div>
  );
};

ChartLayout.propTypes = {
  legendVisible: PropTypes.bool,
  legend: PropTypes.func,
  width: PropTypes.number,
  height: PropTypes.number,
  chart: PropTypes.node,
  children: PropTypes.node,
  style: PropTypes.object,
  legendPosition: PropTypes.oneOf([
    'right',
    undefined,
  ]),
};

export default ChartLayout;

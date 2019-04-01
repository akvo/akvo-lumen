import React from 'react';
import PropTypes from 'prop-types';

const calculateDimensions = ({ width, height, legendVisible, legendPosition, legendHeight }) => {
  if (!legendVisible) {
    return { horizontal: true, chart: width };
  }
  const dimensions = {};
  switch (legendPosition) {

    case 'top': {
      dimensions.horizontal = false;
      dimensions.chartBeforeLegend = false;
      dimensions.legend = legendHeight || 100;
      dimensions.chart = height - dimensions.legend;
      break;
    }

    case 'right': {
      dimensions.horizontal = true;
      dimensions.chartBeforeLegend = true;
      if (width >= 600) {
        dimensions.legend = 250;
      } else if (width >= 400) {
        dimensions.legend = 200;
      }
      if (width < 400) {
        dimensions.legend = width / 3;
      }
      dimensions.chart = width - dimensions.legend;
      break;
    }

    case 'bottom': {
      dimensions.horizontal = false;
      dimensions.chartBeforeLegend = true;
      dimensions.legend = legendHeight || 100;
      dimensions.chart = height - dimensions.legend;
      break;
    }

    case 'left': {
      dimensions.horizontal = true;
      dimensions.chartBeforeLegend = false;
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
        dimensions.legend = dimensions.horizontal ? 250 : legendHeight || 150;
      } else if (biggerDimension >= 400) {
        dimensions.legend = dimensions.horizontal ? 200 : legendHeight || 150;
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
  legendHeight,
  style = {},
  ...rest
}) => {
  const dimensions = calculateDimensions({
    width,
    height,
    legendVisible,
    legendPosition,
    legendHeight,
  });

  return dimensions.horizontal ? (
    <div style={{ display: 'flex', height, width, flexGrow: 1, ...style }} {...rest}>
      {children}
      {dimensions.chartBeforeLegend && (
        <div style={{ height, width: dimensions.chart }}>
          {chart}
        </div>
      )}
      {legendVisible && (
        <div style={{ height, width: dimensions.legend, overflow: 'auto' }}>
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
    <div style={{ height, width, flexGrow: 1, ...style }} {...rest}>
      {children}
      {dimensions.chartBeforeLegend && (
        <div style={{ height: dimensions.chart, width }}>
          {chart}
        </div>
      )}
      {legendVisible && (
        <div style={{ width, height: dimensions.legend, overflow: 'auto' }}>
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
    'top',
    'right',
    'bottom',
    'left',
    undefined,
  ]),
  legendHeight: PropTypes.number,
};

export default ChartLayout;

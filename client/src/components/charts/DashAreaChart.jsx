import React, { PropTypes } from 'react';
import { AreaChart } from 'rd3';
import * as chart from '../../utilities/chart';

export default function DashAreaChart({ visualisation, datasets, width, height }) {
  const chartData = chart.getChartData(visualisation, datasets);
  const { name, spec } = visualisation;

  const gridHorizontal = true;
  const gridVertical = true;

  const xOffset = 40;
  const yOffset = 70;

  const computedHeight = height || 400;
  const computedWidth = width || 800;

  const hasAxisLabels = Boolean(visualisation.spec.labelX || visualisation.spec.labelY);

  const chartHeight = hasAxisLabels ? computedHeight - 32 - 24 : computedHeight - 24;
  const chartWidth = hasAxisLabels ? computedWidth - 64 : computedWidth;

  const className = chart.getClassName(computedWidth, hasAxisLabels);

  return (
    <div
      className={`DashAreaChart ${className}`}
      style={{
        width: computedWidth,
        height: computedHeight,
      }}
    >
      <AreaChart
        title={name}
        height={chartHeight}
        width={chartWidth}
        data={chartData}
        gridHorizontal={gridHorizontal}
        gridVertical={gridVertical}
        xAxisLabel={spec.labelX || ''}
        yAxisLabel={spec.labelY || ''}
        xAxisLabelOffset={xOffset}
        yAxisLabelOffset={yOffset}
      />
    </div>
  );
}

DashAreaChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
};

import React, { PropTypes } from 'react';
import { BarChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashBarChart({ visualisation, datasets, width, height }) {
  const chartData = chart.getChartData(visualisation, datasets);
  const { name, spec } = visualisation;

  const xOffset = 40;
  const yOffset = 70;

  const computedHeight = height ? height : 400;
  const computedWidth = width ? width : 800;

  const hasAxisLabels = Boolean(visualisation.spec.labelX || visualisation.spec.labelY);

  const chartHeight = hasAxisLabels ? computedHeight - 32 - 24 : computedHeight - 24;
  const chartWidth = hasAxisLabels ? computedWidth - 64 : computedWidth;

  const className = chart.getClassName(computedWidth, hasAxisLabels);

  return (
    <div
      className={`DashBarChart ${className}`}
      style={{
        width: computedWidth,
        height: computedHeight,
      }}
    >
      <BarChart
        title={name}
        height={chartHeight}
        width={chartWidth}
        data={chartData}
        xAxisLabel={spec.labelX || ''}
        yAxisLabel={spec.labelY || ''}
        xAxisLabelOffset={xOffset}
        yAxisLabelOffset={yOffset}
      />
    </div>
  );
}

DashBarChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

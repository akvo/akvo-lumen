import React, { PropTypes } from 'react';
import { BarChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashBarChart({ visualisation, datasets, width, height }) {
  const chartData = chart.getChartData(visualisation, datasets);
  const { name, spec } = visualisation;

  const computedHeight = height ? height : 400;
  const computedWidth = width ? width : 800;

  const hasAxisLabels = Boolean(visualisation.spec.labelX || visualisation.spec.labelY);
  const hasNameColumn = Boolean(visualisation.spec.datasetNameColumnX);

  const xOffset = hasNameColumn ? 40 + 48 : 40;
  const yOffset = 70;

  let chartHeight = hasAxisLabels ? computedHeight - 32 - 24 : computedHeight - 24;
  chartHeight = hasNameColumn ? chartHeight - 64 : chartHeight;
  const chartWidth = hasAxisLabels ? computedWidth - 64 : computedWidth;

  let className = chart.getClassName(computedWidth, hasAxisLabels);

  if (hasNameColumn) {
    className = `${className} hasNameColumn`;
  }

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

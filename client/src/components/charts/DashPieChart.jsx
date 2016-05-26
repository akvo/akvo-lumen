import React, { PropTypes } from 'react';
import { PieChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashPieChart({ visualisation, datasets, width, height}) {
  const chartData = chart.getChartData(visualisation, datasets);
  const innerRadius = visualisation.visualisationType === 'donut' ? 20 : null;

  const computedHeight = height ? height : 400;
  const computedWidth = width ? width : 400;

  const chartHeight = computedHeight - 24;
  const chartWidth = computedWidth;
  const chartRadius = chartHeight < chartWidth ? chartHeight / 4 : chartWidth / 4;

  return (
    <div
      className="DashPieChart dashChart"
      style={{
        height: computedHeight,
        width: computedWidth,
      }}
    >
      <PieChart
        title={visualisation.name}
        height={chartHeight}
        width={chartWidth}
        radius={chartRadius}
        innerRadius={innerRadius}
        data={chartData}
        sectorBorderColor="white"
        showInnerLabels={true}
      />
    </div>
  );
}

DashPieChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

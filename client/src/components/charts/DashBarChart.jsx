import React, { PropTypes } from 'react';
import { BarChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashBarChart({ visualisation, datasets, width, height }) {
  const chartData = chart.getChartData(visualisation, datasets);
  const { name, spec } = visualisation;

  return (
    <div className="DashBarChart dashChart">
      <BarChart
        title={name}
        width={width || 800}
        height={height || 400}
        data={chartData}
        xAxisLabel={spec.labelX || ''}
        yAxisLabel={spec.labelY || ''}
        xAxisLabelOffset={0}
        yAxisLabelOffset={0}
      />
    </div>
  );
}

DashBarChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

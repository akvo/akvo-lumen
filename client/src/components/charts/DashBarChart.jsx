import React, { PropTypes } from 'react';
import { BarChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashBarChart({ visualisation, datasets }) {
  const chartData = chart.getChartData(visualisation, datasets);
  const { name, spec } = visualisation;

  return (
    <div className="DashBarChart dashChart">
      <BarChart
        title={name}
        width={800}
        height={400}
        data={chartData}
        xAxisLabel={spec.labelX || ''}
        yAxisLabel={spec.labelY || ''}
        xAxisLabelOffset={50}
        yAxisLabelOffset={75}
      />
    </div>
  );
}

DashBarChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

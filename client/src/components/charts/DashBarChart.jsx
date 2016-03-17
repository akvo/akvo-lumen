import React, { PropTypes } from 'react';
import { BarChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashBarChart({ visualisation, datasets }) {
  const chartData = chart.getChartData(visualisation, datasets);

  return (
    <div className="DashBarChart dashChart">
      <BarChart
        title={visualisation.name}
        width={600}
        height={400}
        data={chartData}
        xAxisLabel={visualisation.labelX || ''}
        yAxisLabel={visualisation.labelY || ''}
      />
    </div>
  );
}

DashBarChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

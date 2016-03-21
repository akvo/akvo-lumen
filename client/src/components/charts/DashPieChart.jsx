import React, { PropTypes } from 'react';
import { PieChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashPieChart({ visualisation, datasets }) {
  const chartData = chart.getChartData(visualisation, datasets);
  const innerRadius = visualisation.visualisationType === 'donut' ? 20 : null;

  return (
    <div className="DashPieChart dashChart">
      <PieChart
        title={visualisation.name}
        height={400}
        width={400}
        radius={100}
        innerRadius={innerRadius}
        data={chartData}
        sectorBorderColor="white"
      />
    </div>
  );
}

DashPieChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

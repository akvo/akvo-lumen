import React, { PropTypes } from 'react';
import { ScatterChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default function DashScatterChart({ visualisation, datasets }) {
  const chartData = chart.getChartData(visualisation, datasets);
  const gridHorizontal = true;
  const gridVertical = true;

  return (
    <div className="DashScatterChart dashChart">
      <ScatterChart
        title={visualisation.name}
        height={400}
        width={800}
        data={chartData}
        gridHorizontal={gridHorizontal}
        gridVertical={gridVertical}
        xAxisLabel={visualisation.labelX || ''}
        yAxisLabel={visualisation.labelY || ''}
        xAxisLabelOffset={50}
        yAxisLabelOffset={75}
      />
    </div>
  );
}

DashScatterChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

import React, { Component, PropTypes } from 'react';
import { LineChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default class DashLineChart extends Component {
  render() {
    const chartData = chart.getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;
    const gridHorizontal = true;
    const gridVertical = true;

    return (
      <div className="DashLineChart dashChart">
        <LineChart
          title={visualisation.name}
          height={400}
          width={800}
          data={chartData}
          gridHorizontal={gridHorizontal}
          gridVertical={gridVertical}
          xAxisLabel={visualisation.labelX || ''}
          yAxisLabel={visualisation.labelY || ''}
          />
      </div>
    );
  }
}

DashLineChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

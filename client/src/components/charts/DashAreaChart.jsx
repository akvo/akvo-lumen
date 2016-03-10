import React, { Component, PropTypes } from 'react';
import { AreaChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default class DashAreaChart extends Component {
  render() {
    const chartData = chart.getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;
    const gridHorizontal = true;
    const gridVertical = true;

    return (
      <div className="DashAreaChart dashChart">
        <AreaChart
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
}

DashAreaChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

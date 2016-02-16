import React, { Component, PropTypes } from 'react';
import { BarChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default class DashBarChart extends Component {
  render() {
    const chartData = chart.getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;

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
}

DashBarChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

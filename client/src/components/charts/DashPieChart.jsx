import React, { Component, PropTypes } from 'react';
import { PieChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default class DashPieChart extends Component {
  render() {
    const chartData = chart.getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;
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
}

DashPieChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

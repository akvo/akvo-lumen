import React, { Component, PropTypes } from 'react';
import { ScatterChart } from 'react-d3';
import * as chart from '../../utilities/chart';

export default class DashScatterChart extends Component {
  render() {
    const chartData = chart.getChartData(this.props.visualisation, this.props.datasets);
    const visualisation = this.props.visualisation;
    const yDomain = visualisation.rangeY || null;
    const gridHorizontal = true;
    const gridVertical = true;

    return (
      <div className="DashScatterChart dashChart">
        <ScatterChart
          title={visualisation.name}
          height={400}
          width={800}
          data={chartData}
          yDomain={yDomain || [0, 100]}
          gridHorizontal={gridHorizontal}
          gridVertical={gridVertical}
          xAxisLabel={visualisation.labelX || ''}
          yAxisLabel={visualisation.labelY || ''}
          />
      </div>
    );
  }
}

DashScatterChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

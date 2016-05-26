import React, { PropTypes } from 'react';
import DashAreaChart from './DashAreaChart';
import DashBarChart from './DashBarChart';
import DashLineChart from './DashLineChart';
import DashMap from './DashMap';
import DashPieChart from './DashPieChart';
import DashScatterChart from './DashScatterChart';

export default function DashChart(props) {

  switch (props.visualisation.visualisationType) {
    case 'bar':
      return (
        <DashBarChart
          {...props}
        />
      );

    case 'line':
      return (
        <DashLineChart
          {...props}
        />
      );

    case 'area':
      return (
        <DashAreaChart
          {...props}
        />
      );

    case 'donut':
    case 'pie':
      return (
        <DashPieChart
          {...props}
        />
      );

      return output;

    case 'scatter':
      return (
        <DashScatterChart
          {...props}
        />
      );

    case 'map':
      return (
        <DashMap
          {...props}
        />
      );

    default:
      throw new Error(`Unknown chart type ${props.visualisation.visualisationType} supplied to DashChart`);
  }
}

DashBarChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

import React, { Component, PropTypes } from 'react';

/* This component should render the same markup as the regular DashChart, but only loads the
/* dependencies needed to render a given chart type, rather than loading all dependencies for all
/* chart types. This is more efficient when we only have to render a known collection of
/* visualisations, rather than any possible visualisation. */

export default class AsyncDashChart extends Component {

  constructor() {
    super();
    this.state = {
      asyncComponents: null,
    };
  }

  componentWillMount() {
    const props = this.props;
    let output;

    if (props.visualisation.visualisationType === 'map') {
      require.ensure(['react-leaflet'], () => {
        // eslint-disable-next-line global-require
        const DashMap = require('./DashMap').default;
        output = DashMap;

        this.setState({
          asyncComponents: {
            output,
          },
        });
      }, 'reactLeaflet');
    } else {
      require.ensure(['rd3'], () => {
        /* eslint-disable global-require */
        const DashAreaChart = require('./DashAreaChart').default;
        const DashBarChart = require('./DashBarChart').default;
        const DashLineChart = require('./DashLineChart').default;
        const DashPieChart = require('./DashPieChart').default;
        const DashScatterChart = require('./DashScatterChart').default;
        /* eslint-enable global-require */

        switch (props.visualisation.visualisationType) {
          case 'bar':
            output = DashBarChart;
            break;

          case 'line':
            output = DashLineChart;
            break;

          case 'area':
            output = DashAreaChart;
            break;

          case 'donut':
          case 'pie':
            output = DashPieChart;
            break;

          case 'scatter':
            output = DashScatterChart;
            break;

          default:
            throw new Error(`Unknown chart type ${props.visualisation.visualisationType}
              supplied to AsyncDashChart`);
        }
        this.setState({
          asyncComponents: {
            output,
          },
        });
      }, 'rd3');
    }
  }

  render() {
    return this.state.asyncComponents ?
      <this.state.asyncComponents.output {...this.props} />
      :
      <div>Loading...</div>
    ;
  }
}

AsyncDashChart.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

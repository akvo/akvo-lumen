import React, { Component, PropTypes } from 'react';

/* This component should render the same markup as the regular VisualisationViewer, but only loads
/* the dependencies needed to render a given chart type, rather than loading all dependencies for
/* all chart types. This is more efficient when we only have to render a known collection of
/* visualisations, rather than any possible visualisation. */

export default class AsyncVisualisationViewer extends Component {

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
        const Map = require('./MapVisualisation').default;

        output = Map;

        this.setState({
          asyncComponents: {
            output,
          },
        });
      }, 'reactLeaflet');
    } else {
      require.ensure(['vega'], () => {
        /* eslint-disable global-require */
        const Chart = require('./Chart').default;
        /* eslint-enable global-require */

        switch (props.visualisation.visualisationType) {
          case 'bar':
          case 'line':
          case 'area':
          case 'donut':
          case 'pie':
          case 'scatter':
            output = Chart;
            break;

          default:
            throw new Error(`Unknown chart type ${props.visualisation.visualisationType}
              supplied to AsyncVisualisationViewer`);
        }
        this.setState({
          asyncComponents: {
            output,
          },
        });
      }, 'vega');
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

AsyncVisualisationViewer.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

import React, { Component } from 'react';
import PropTypes from 'prop-types';

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
    const { visualisation } = this.props;
    let output;

    if (visualisation.visualisationType === 'map') {
      require.ensure(['react-leaflet'], () => {
        // eslint-disable-next-line global-require
        const MapVisualisation = require('./MapVisualisation').default;

        output = MapVisualisation;

        this.setState({
          asyncComponents: {
            output,
          },
        });
      }, 'reactLeaflet');
    } else if (visualisation.visualisationType === 'pivot table') {
      this.setState({
        asyncComponents: {
          // eslint-disable-next-line global-require
          output: require('./PivotTable').default,
        },
      });
    } else {
      require.ensure(['vega'], () => {
        // eslint-disable-next-line global-require
        const Chart = require('./Chart').default;

        switch (visualisation.visualisationType) {
          case 'bar':
          case 'line':
          case 'area':
          case 'donut':
          case 'pie':
          case 'scatter':
            output = Chart;
            break;

          default:
            throw new Error(`Unknown chart type ${visualisation.visualisationType}
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
      <div className="loadingIndicator">Loading...</div>;
  }
}

AsyncVisualisationViewer.propTypes = {
  visualisation: PropTypes.object.isRequired,
};

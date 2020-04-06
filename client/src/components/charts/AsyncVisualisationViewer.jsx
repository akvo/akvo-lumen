import React, { Component } from 'react';
import PropTypes from 'prop-types';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/* This component should render the same markup as the regular VisualisationViewer, but only loads
/* the dependencies needed to render a given chart type, rather than loading all dependencies for
/* all chart types. This is more efficient when we only have to render a known collection of
/* visualisations, rather than any possible visualisation. */

export default class AsyncVisualisationViewer extends Component {

  constructor(props) {
    super(props);
    const visualisation = props.visualisation;

    if (visualisation.visualisationType === 'pivot table') {
      this.state = {
        asyncComponents: {
          // eslint-disable-next-line global-require
          output: require('./PivotTable').default,
        },
      };
    } else {
      this.state = { asyncComponents: {} };
    }
  }

  componentDidUpdate() {
    const visualisation = this.props.visualisation;
    if (!this.state.asyncComponents.output) {
      if (visualisation.visualisationType === 'map') {
        require.ensure(['leaflet'], () => {
          this.setState({
            asyncComponents: {
              // eslint-disable-next-line global-require
              output: require('./MapVisualisation').default,
            },
          });
        }, 'leaflet');
      } else {
        require.ensure([
          '@potion/color',
          '@potion/element',
          '@potion/extra',
          '@potion/layout',
          '@vx/axis',
          '@vx/grid',
          '@vx/legend',
          '@vx/scale',
          '@nivo/core',
          'd3-array',
          'd3-scale',
          'd3-scale-chromatic',
          'd3-shape',
          'datalib',
        ], () => {
          switch (visualisation.visualisationType) {
            case 'bar':
            case 'line':
            case 'area':
            case 'donut':
            case 'pie':
            case 'polararea':
            case 'scatter':
            case 'bubble':
              this.setState({
                asyncComponents: {
                  // eslint-disable-next-line global-require
                  output: require('./Chart').default,
                },
              });
              break;
            default:
              throw new Error(`Unknown chart type ${visualisation.visualisationType}
                              supplied to AsyncVisualisationViewer`);
          }
        });
      }
    }
  }

  render() {
    const OutputComponent = this.state.asyncComponents.output;
    return OutputComponent ?
      <OutputComponent {...this.props} />
      :
      <LoadingSpinner />;
  }
}

AsyncVisualisationViewer.propTypes = {
  visualisation: PropTypes.object.isRequired,
};

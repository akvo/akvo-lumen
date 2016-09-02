import React, { PropTypes } from 'react';
import Chart from './Chart';
import MapVisualisation from './MapVisualisation';

export default function VisualisationViewer(props) {
  switch (props.visualisation.visualisationType) {
    case 'bar':
    case 'line':
    case 'area':
    case 'donut':
    case 'pie':
    case 'scatter':
      return (
        <Chart
          {...props}
        />
      );

    case 'map':
      return (
        <MapVisualisation
          {...props}
        />
      );

    default:
      throw new Error(`Unknown chart type ${props.visualisation.visualisationType}
        supplied to VisualisationViewer`);
  }
}

VisualisationViewer.propTypes = {
  visualisation: PropTypes.object.isRequired,
  datasets: PropTypes.object.isRequired,
};

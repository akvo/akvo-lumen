import React from 'react';
import PropTypes from 'prop-types';
import Chart from './Chart';
import MapVisualisation from './MapVisualisation';
import PivotTable from './PivotTable';

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

    case 'pivottable':
      return (
        <PivotTable
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

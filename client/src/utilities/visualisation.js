/* eslint-disable import/prefer-default-export */

import visualisationColumnMappings from '../constants/Visualisation/visualisationColumnMappings';

export const remapVisualisationDataColumnMappings = (visualisation, newVisualisationType) => (
  !visualisation.visualisationType ?
    {} :
    visualisationColumnMappings[visualisation.visualisationType][newVisualisationType]
      .reduce((acc, { from, to }) => ({
        ...acc,
        [to]: visualisation.spec[from],
      }), {})
);

/* eslint-disable import/prefer-default-export */

import specMappings from '../constants/Visualisation/visualisationSpecMappings';

export const remapVisualisationDataColumnMappings = (visualisation, newVisualisationType) => {
  if (!visualisation.visualisationType) return {};
  const mappings = specMappings[visualisation.visualisationType][newVisualisationType];
  return Object.keys(mappings)
      .reduce((acc, key) => ({
        ...acc,
        [mappings[key]]: visualisation.spec[key],
      }), {});
};

/* eslint-disable import/prefer-default-export */
import itsSet from 'its-set';

import specMappings from '../constants/Visualisation/visualisationSpecMappings';

export const remapVisualisationDataColumnMappings = (visualisation, newVisualisationType) => {
  if (!visualisation.visualisationType) return {};

  if (visualisation.visualisationType === newVisualisationType) {
    return visualisation.spec;
  }

  const mappings = specMappings[visualisation.visualisationType][newVisualisationType] || {};

  if (!specMappings[visualisation.visualisationType][newVisualisationType]) {
    console.warn(`visualization data column mappings not defined for ${visualisation.visualisationType} -> ${newVisualisationType}`);  /* eslint-disable-line */
  }
  return Object.keys(mappings)
    .reduce((acc, key) => {
      const result = { ...acc };
      if (itsSet(visualisation.spec[key])) {
        result[mappings[key]] = visualisation.spec[key];
      }
      return result;
    }, {});
};

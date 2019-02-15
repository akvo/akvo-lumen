/* eslint-disable import/prefer-default-export */
import itsSet from 'its-set';

import specMappings from '../constants/Visualisation/visualisationSpecMappings';

export const remapVisualisationDataColumnMappings = (visualisation, newVisualisationType) => {
  if (!visualisation.visualisationType) return {};
  const mappings = specMappings[visualisation.visualisationType][newVisualisationType];
  return Object.keys(mappings)
    .reduce((acc, key) => {
      const result = { ...acc };
      if (itsSet(visualisation.spec[key])) {
        result[mappings[key]] = visualisation.spec[key];
      }
      return result;
    }, {});
};

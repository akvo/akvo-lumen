/* eslint-disable import/prefer-default-export */

export const datasetsWithVisualizations = (visualisations, datasets) => {
  const visualisationsSet = new Set(visualisations.map(v => v.datasetId).filter(v => v));
  return Object.keys(datasets).filter(d => visualisationsSet.has(d))
        .reduce((c, v) => { const h = c; h[v] = datasets[v]; return c; }, {});
};

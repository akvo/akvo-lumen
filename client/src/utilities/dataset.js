/* eslint-disable import/prefer-default-export */

export const mapDatasetLayers = viz => viz.spec.layers.map(l => l.datasetId);

export const datasetsWithVisualizations = (visualisations, datasets) => {
  const datasetIds = visualisations.reduce((acc, viz) => {
    let ids = viz.datasetId;
    if (viz.visualisationType === 'map') {
      ids = mapDatasetLayers(viz);
    }
    return acc.concat(ids);
  }, []);
  const visualisationsSet = new Set(datasetIds.filter(id => id));
  return Object.keys(datasets).filter(d => visualisationsSet.has(d))
        .reduce((c, v) => { const h = c; h[v] = datasets[v]; return c; }, {});
};

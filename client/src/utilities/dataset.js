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

export const getDatasetGroups = (groupsList) => {
  const groups = groupsList;

  // keep metadata at the top
  const groupNames = groups.reduce((acc, curr) => acc.concat({
    id: curr.get(1).get(0).get('groupId'),
    name: curr.get(1).get(0).get('groupName'),
    isRqg: curr.get(1).get(0).get('repeatable'),
  }), []).sort((x, y) => {
    if (x.id === 'metadata') {
      return -1;
    }

    if (y.id === 'metadata') {
      return 1;
    }

    return 0;
  });

  return groupNames;
};

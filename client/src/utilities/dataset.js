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

export const getDatasetGroups = (groups, datasetGroupsAvailable) => {

  if (!datasetGroupsAvailable) {
    return [];
  }

  const groupsObject = groups.toJS();
  let groupNames = [];

  // trying to keep metadata at the top
  // refactor if you can think of a better implementation
  const withoutMetadata = Object.keys(groupsObject).filter(group => group !== 'metadata');

  groupNames = withoutMetadata
    .reduce((acc, curr) => {
      const column = groups.toJS()[curr][0];

      if (column) {
        acc.push({ id: column.groupId, name: column.groupName });
      }

      return acc;
    }, []);

  groupNames.unshift({ id: 'metadata', name: 'metadata' });

  return groupNames;
};

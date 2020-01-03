export function isSelectionFilled(checkboxEntities) {
  const { visualisations, datasets, dashboards, rasters } = checkboxEntities;
  return visualisations.length > 0 || datasets.length > 0 ||
  dashboards.length > 0 || rasters.length > 0;
}

export function count(checkboxEntities) {
  const { visualisations, datasets, dashboards, rasters } = checkboxEntities;
  return visualisations.length + datasets.length +
  dashboards.length + rasters.length;
}

export function collectionModel() {
  return { visualisations: [], dashboards: [], datasets: [], rasters: [] };
}

export const filterLibraryByCollection = (library, collection) => {
  const filteredLibrary = {};

  filteredLibrary.datasets = {};
  filteredLibrary.visualisations = {};
  filteredLibrary.dashboards = {};
  filteredLibrary.rasters = {};

  collection.datasets.forEach((entityId) => {
    if (library.datasets[entityId]) {
      filteredLibrary.datasets[entityId] = library.datasets[entityId];
    }
  });
  collection.visualisations.forEach((entityId) => {
    if (library.visualisations[entityId]) {
      filteredLibrary.visualisations[entityId] = library.visualisations[entityId];
    }
  });
  collection.dashboards.forEach((entityId) => {
    if (library.dashboards[entityId]) {
      filteredLibrary.dashboards[entityId] = library.dashboards[entityId];
    }
  });
  collection.rasters.forEach((entityId) => {
    if (library.rasters[entityId]) {
      filteredLibrary.rasters[entityId] = library.rasters[entityId];
    }
  });

  return Object.assign({}, library, filteredLibrary);
};

import { push } from 'react-router-redux';

function mergeQuery(location, query) {
  return Object.assign({}, location, {
    query: Object.assign({}, location.query, query),
  });
}

export function updateQueryAction(location, query) {
  return push(mergeQuery(location, query));
}

export function filterLibraryByCollection(library, collection) {
  const filteredLibrary = {};

  filteredLibrary.datasets = {};
  filteredLibrary.visualisations = {};
  filteredLibrary.dashboards = {};

  collection.entities.forEach((entityId) => {
    if (library.visualisations[entityId]) {
      filteredLibrary.visualisations[entityId] = library.visualisations[entityId];
    } else if (library.datasets[entityId]) {
      filteredLibrary.datasets[entityId] = library.datasets[entityId];
    } else if (library.dashboards[entityId]) {
      filteredLibrary.dashboards[entityId] = library.dashboards[entityId];
    }
  });

  return Object.assign({}, library, filteredLibrary);
}

import { push } from 'react-router-redux';

const mergeQuery = (location, query) =>
  Object.assign({}, location, {
    query: Object.assign({}, location.query, query),
  });

const updateQueryAction = (location, query) =>
  push(mergeQuery(location, query));

const filterLibraryByCollection = (library, collection) => {
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
};

export default { updateQueryAction, filterLibraryByCollection };

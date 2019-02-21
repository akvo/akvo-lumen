import { handleActions } from 'redux-actions';
import update from 'react-addons-update';
import { get } from 'lodash';
import * as actions from '../actions/dashboard';

export const initialState = {};

function createDashboard(state, { payload }) {
  const id = payload.id;
  return update(state, {
    [id]: { $set: payload },
  });
}

function editDashboard(state, { payload }) {
  const id = payload.id;
  return Object.assign({}, state, {
    [id]: payload,
  });
}

function saveDashboards(state, { payload }) {
  return payload.reduce((result, dashboard) => {
    const id = dashboard.id;
    if (state[id] == null) {
      return update(result, {
        [id]: { $set: update(dashboard, { $merge: { type: 'dashboard', status: 'OK' } }) },
      });
    }
    return result;
  }, state);
}

function saveDashboard(state, { payload }) {
  const id = payload.id;
  return Object.assign({}, state, {
    [id]: payload,
  });
}

function saveShareId(state, { payload }) {
  const id = payload.id;
  return {
    ...state,
    [id]: { ...state[id], ...payload },
  };
}

function saveShareProtection(state, { payload }) {
  const { shareId, data } = payload;
  const dashboardId = Object.keys(state).filter(id => state[id].shareId === shareId)[0];
  if (!dashboardId) return state;
  return {
    ...state,
    [dashboardId]: { ...state[dashboardId], ...data },
  };
}

function removeDashboard(state, { payload }) {
  const newState = Object.assign({}, state);
  delete newState[payload];
  return newState;
}


function removeVisualisationFromDashboardLayout(layout, visualisationId) {
  const newLayout = Object.assign({}, layout);
  delete newLayout[visualisationId];
  return newLayout;
}

function removeVisualisationFromDashboardEntities(entities, visualisationId) {
  const newEntities = Object.assign({}, entities);
  delete newEntities[visualisationId];
  return newEntities;
}

function removeVisualisationFromDashboard(dashboard, visualisationId) {
  return Object.assign({}, dashboard, {
    layout: removeVisualisationFromDashboardLayout(dashboard.layout, visualisationId),
    entities: removeVisualisationFromDashboardEntities(dashboard.entities, visualisationId),
  });
}

function containsVisualisation(dashboard, visualisationId) {
  return get(dashboard, `entities[${visualisationId}]`) != null;
}

function removeVisualisation(state, { payload }) {
  const visualisationId = payload;
  const dashboards = Object.assign({}, state);
  Object.keys(dashboards).forEach((dashboardId) => {
    const dashboard = dashboards[dashboardId];
    if (containsVisualisation(dashboard, visualisationId)) {
      dashboards[dashboardId] = removeVisualisationFromDashboard(dashboard, visualisationId);
    }
  });
  return dashboards;
}

function exportStarted(state, { payload: { id } }) {
  return {
    ...state,
    [id]: { ...state[id], isExporting: true },
  };
}

function exportSucceeded(state, { payload: { id } }) {
  return {
    ...state,
    [id]: { ...state[id], isExporting: false },
  };
}

function exportFailed(state, { payload: { id } }) {
  return {
    ...state,
    [id]: { ...state[id], isExporting: false },
  };
}

export default handleActions({
  [actions.createDashboardSuccess]: createDashboard,
  [actions.fetchDashboardsSuccess]: saveDashboards,
  [actions.fetchDashboardSuccess]: saveDashboard,
  [actions.editDashboardSuccess]: editDashboard,
  [actions.deleteDashboardSuccess]: removeDashboard,
  [actions.removeVisualisation]: removeVisualisation,
  [actions.fetchShareIdSuccess]: saveShareId,
  [actions.setShareProtectionSuccess]: saveShareProtection,
  [actions.exportDashboardRequest]: exportStarted,
  [actions.exportDashboardSuccess]: exportSucceeded,
  [actions.exportDashboardFailure]: exportFailed,
}, initialState);

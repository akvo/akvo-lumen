import update from 'react-addons-update';
import * as constants from '../constants/dashboard';

export const initialState = {};

function createDashboard(state, dashboardData) {
  const id = dashboardData.id;
  return update(state, {
    [id]: { $set: dashboardData },
  });
}

function editDashboard(state, dashboardData) {
  const id = dashboardData.id;
  return Object.assign({}, state, {
    [id]: dashboardData,
  });
}

function saveDashboards(state, dashboards) {
  // TODO we should probably not overwrite?
  return dashboards.reduce((result, dash) => {
    const id = dash.id;
    return update(result, {
      [id]: { $set: update(dash, { $merge: { type: 'dashboard', status: 'OK' } }) },
    });
  }, state);
}

function saveDashboard(state, dash) {
  const id = dash.id;
  return update(state, {
    [id]: { $merge: dash },
  });
}

function removeDashboard(state, id) {
  const newState = Object.assign({}, state);
  delete newState[id];
  return newState;
}

export default function dashboard(state = initialState, action) {
  switch (action.type) {
    case constants.CREATE_DASHBOARD_SUCCESS:
      return createDashboard(state, action.dashboard);
    case constants.FETCH_DASHBOARDS_SUCCESS:
      return saveDashboards(state, action.dashboards);
    case constants.FETCH_DASHBOARD_SUCCESS:
      return saveDashboard(state, action.dashboard);
    case constants.EDIT:
      return editDashboard(state, action.dashboard);
    case constants.REMOVE_DASHBOARD:
      return removeDashboard(state, action.id);
    default: return state;
  }
}

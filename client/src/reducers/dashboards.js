import { handleActions } from 'redux-actions';
import update from 'react-addons-update';
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

function removeDashboard(state, { payload }) {
  const newState = Object.assign({}, state);
  delete newState[payload];
  return newState;
}

export default handleActions({
  [actions.createDashboardSuccess]: createDashboard,
  [actions.fetchDashboardsSuccess]: saveDashboards,
  [actions.fetchDashboardSuccess]: saveDashboard,
  [actions.editDashboardSuccess]: editDashboard,
  [actions.deleteDashboardSuccess]: removeDashboard,
}, initialState);

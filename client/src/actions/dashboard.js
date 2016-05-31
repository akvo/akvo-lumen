import * as constants from '../constants/dashboard';
import { fetchDataset } from './dataset';
import fetch from 'isomorphic-fetch';
import headers from './headers';

function createDashboardRequest(dashboard) {
  return (dispatch) => {
    dispatch({
      type: constants.CREATE_DASHBOARD_REQUEST,
      dashboard,
    });
    fetch('/api/dashboards', {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(dashboard),
    })
    .then(response => response.json())
    .then(dash => dispatch(createDashboardSuccess(dash)))
    .catch(err => dispatch(createDashboardFailure(err)));
  };
}

export function createDashboard(dashboard) {
  return createDashboardRequest(dashboard);
}

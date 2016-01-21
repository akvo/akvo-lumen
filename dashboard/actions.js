import fetch from 'isomorphic-fetch'

/* See README.md for how to add this file */
import { FLOW_AUTH_TOKEN } from './secrets'

/*
 * action types
 */

export const ADD_TODO = 'ADD_TODO'
export const COMPLETE_TODO = 'COMPLETE_TODO'
export const SET_VISIBILITY_FILTER = 'SET_VISIBILITY_FILTER'

/*
 * other constants
 */

export const VisibilityFilters = {
  SHOW_ALL: 'SHOW_ALL',
  SHOW_COMPLETED: 'SHOW_COMPLETED',
  SHOW_ACTIVE: 'SHOW_ACTIVE'
}

/*
 * action creators
 */

export function addTodo(text) {
  return { type: ADD_TODO, text }
}

export function completeTodo(index) {
  return { type: COMPLETE_TODO, index }
}

export function setVisibilityFilter(filter) {
  return { type: SET_VISIBILITY_FILTER, filter }
}

/*
** DATASETS
*/

/*
** fetch dataset
*/

export function beginDownloadDataset(url) {
	return {type: 'BEGIN_ADD_DATASET', url: url}
};

export function downloadDatasetSuccess(data) {
	return {type: 'ADD_DATASET_SUCCESS', data: data}
}

export function fetchDataset(url) {
	return function(dispatch) {
		dispatch(beginDownloadDataset(url));

		return fetch(url, {
				  method: 'get',
				  headers: {
				   'Authorization': 'Basic ' + FLOW_AUTH_TOKEN
				  }
			  })
			.then(response => response.json())
			.then(json => {
				dispatch(downloadDatasetSuccess(json));
			});
	}
}

/*
** save dataset name
*/

export function saveDatasetName(name) {
	return {type: 'SAVE_DATASET_NAME', name: name}
}

/*
** VISUALISATIONS
/*

/*
** show dataset graph
*/

export function requestDatasetGraph(index) {
	return {type: 'REQUEST_DATASET_GRAPH', datasetIndex: index}
}

/*
** toggle display of the "Add Visualisation" modal
** (only one can be open at a time)
*/

export function toggleVisualisationModal(datasetID) {
	return {type: 'TOGGLE_VISUALISATION_MODAL', set: datasetID}
}

/*
** save visualisation from dataset
*/

export function saveVisualisation(obj) {
	return {type: 'SAVE_VISUALISATION', data: obj}
}

/*
** DASHBOARDS
*/

/*
** open the "new dashboard" dialog and prepare to add new dashboard
*/

export function beginAddDashboard() {
	return {type: 'BEGIN_ADD_DASHBOARD'}
}

export function cancelAddDashboard() {
	return {type: 'CANCEL_ADD_DASHBOARD'}
}

export function confirmAddDashboard(title) {
	return {type: 'CONFIRM_ADD_DASHBOARD', title: title}
}

export function toggleVisualisationToPendingDashboard(id) {
	return {type: 'TOGGLE_PENDING_DASHBOARD_VISUALISATION', visualisationID: id}
}

/*
** select an active dashboard to display in the dashboard container
*/

export function toggleActiveDashboard(dashboardID) {
	return {type: 'TOGGLE_ACTIVE_DASHBOARD', dashboardID: dashboardID}
}

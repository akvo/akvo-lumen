import { combineReducers } from 'redux'
import { routerStateReducer } from 'redux-router'
import { ADD_TODO, COMPLETE_TODO, SET_VISIBILITY_FILTER, VisibilityFilters } from './actions'
const { SHOW_ALL } = VisibilityFilters

function dataSets(state={dataSets: []}, action) {
  switch(action.type) {
    case "BEGIN_ADD_DATASET":
      return Object.assign({}, state, {
        isFetchInProgress: true
      }) 
    case "ADD_DATASET_SUCCESS":
      var newDataSets = state.dataSets.slice(0, state.dataSets.length);
      newDataSets.push(action.data);
      newDataSets[newDataSets.length - 1].visualisations = [];
      return Object.assign({}, state, {
        dataSets: newDataSets,
        waitingForDatasetName: true,
        isFetchInProgress: false
      }) 
    case "ADD_DATASET_ERROR":
      return state;
    case "SAVE_DATASET_NAME":
      var newDatasets = state.dataSets.slice(0, state.dataSets.length);
      newDatasets[newDatasets.length - 1].name = action.name;
      return Object.assign({}, state, {
        waitingForDatasetName: false,
        dataSets: newDatasets
      })
    case "REQUEST_DATASET_GRAPH":
      return Object.assign({}, state, {
        activeDatasetGraph: action.datasetIndex
      })
    default: 
      return state;
  }
}

function visualisations(state={all: [], activeVisualisationModal: null}, action) {
  switch(action.type) {
    case "TOGGLE_VISUALISATION_MODAL":
      return Object.assign({}, state, {
        activeVisualisationModal: action.set === state.activeVisualisationModal ? null : action.set
      })
    case "SAVE_VISUALISATION":
      var newAll = state.all.slice(0, state.all.length);
      newAll.push(action.data);
      return Object.assign({}, state, {
        all: newAll
      });
    default:
      return state;
  }
}

function dashboards(state={all: [], pendingDashboard: {exists: false, visualisations: []}, activeDashboard: null}, action) {
  switch(action.type) {
    case "BEGIN_ADD_DASHBOARD":
      return Object.assign({}, state, {
        pendingDashboard: {exists: true, visualisations: []},
        activeDashboard: null
      });
    case "CONFIRM_ADD_DASHBOARD":
      var newDashboard = Object.assign({}, state.pendingDashboard, {
        name: action.title
      })
      var newAll = state.all.slice(0);
      newAll.push(newDashboard);
      return Object.assign({}, state, {
        all: newAll,
        pendingDashboard: {exists: false, visualisations: []}
      });
    case "CANCEL_ADD_DASHBOARD":
      return Object.assign({}, state, {
        pendingDashboard: {exists: false, visualisations: []}
      });
    case "TOGGLE_PENDING_DASHBOARD_VISUALISATION":
      var newPendingDashboardVisualisations = state.pendingDashboard.visualisations.slice(0);
      var dupeIndex = -1;

      for (var i = 0; i < newPendingDashboardVisualisations.length; i++) {
        var test = newPendingDashboardVisualisations[i];

        if (parseInt(test) === parseInt(action.visualisationID)) {
          dupeIndex = i;
          break;
        }
      }

      if (dupeIndex === -1) {
        // The toggled visualisation was not present, add it to the array
        newPendingDashboardVisualisations.push(action.visualisationID);
      } else {
        // The toggled visualisation was already present, remove it from the array
        newPendingDashboardVisualisations.splice(dupeIndex, 1);
      }

      var newPendingDashboard = Object.assign({}, state.pendingDashboard, {
        visualisations: newPendingDashboardVisualisations
      });

      return Object.assign({}, state, {
        pendingDashboard: newPendingDashboard
      });  
    case "TOGGLE_ACTIVE_DASHBOARD":
      var newActiveValue;
      parseInt(action.dashboardID) === parseInt(state.activeDashboard) ?
        newActiveValue = null : newActiveValue = action.dashboardID;
      return Object.assign({}, state, {
        activeDashboard: newActiveValue
      });
    default:
      return state;
  }
}

const todoApp = combineReducers({
  router: routerStateReducer,
  dataSets,
  visualisations,
  dashboards
})

export default todoApp
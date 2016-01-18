import React, { Component, PropTypes } from 'react';
import { connect, pushState } from 'react-redux';
import { fetchDataset, saveDatasetName, requestDatasetGraph, beginAddDashboard,
cancelAddDashboard, confirmAddDashboard, toggleVisualisationToPendingDashboard, toggleActiveDashboard} from '../actions';
import { Link } from 'react-router';
import Navigation from '../components/Navigation';
import DashboardList from '../components/DashboardList';
import AddDashboardDialog from '../components/AddDashboardDialog';

class Dashboards extends Component {

  render() {
    // Injected by connect() call:
    const { router, visualisations, dashboards, dispatch, dataSets } = this.props;
    return (
      <div>
        <h1>Akvo DASH prototype</h1>
        <Navigation router={router}
        visualisations={visualisations}
        dashboards={dashboards} />
        <h2>Dashboards</h2>
        {!dashboards.pendingDashboard.exists &&
          <button onClick={() => dispatch(beginAddDashboard())}>
            Add  Dashboard
          </button>
        }
        {dashboards.pendingDashboard.exists &&
          <AddDashboardDialog 
            cancelAddDashboard={() => dispatch(cancelAddDashboard())}
            confirmAddDashboard={(data) => dispatch(confirmAddDashboard(data))}
            visualisations={visualisations}
            datasets={dataSets}
            toggleVisualisationToPendingDashboard={(id) => 
              dispatch(toggleVisualisationToPendingDashboard(id))
            }/>
        }
        <DashboardList
          dashboards={dashboards}
          visualisations={visualisations}
          datasets={dataSets}
          toggleActiveDashboard={(id) =>
            dispatch(toggleActiveDashboard(id))
          }/>
      </div>
    )
  }
}

// Which props do we want to inject, given the global state?
// Note: use https://github.com/faassen/reselect for better performance.
function select(state) {
  return state;
}

// Wrap the component to inject dispatch and state into it
export default connect(select)(Dashboards)
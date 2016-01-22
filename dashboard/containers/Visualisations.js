import React, { Component, PropTypes } from 'react'
import { connect, pushState } from 'react-redux'
import { fetchDataset, saveDatasetName, requestDatasetGraph } from '../actions'
import { Link } from 'react-router'
import Navigation from '../components/Navigation'
import VisualisationList from '../components/VisualisationList'

class Visualisations extends Component {

  render() {
    // Injected by connect() call:
    const { dispatch, router, visualisations, dataSets, dashboards } = this.props;
    return (
      <div>
        <h1>Akvo DASH prototype</h1>
        <Navigation
          router={router}
          visualisations={visualisations}
          dashboards={dashboards} />
        <h2>Visualisations</h2>
        <VisualisationList
          datasets={dataSets}
          visualisations={visualisations} />
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
export default connect(select)(Visualisations)

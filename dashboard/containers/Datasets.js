import React, { Component, PropTypes } from 'react'
import { connect, pushState } from 'react-redux'
import { fetchDataset, saveDatasetName, requestDatasetGraph, saveVisualisation, toggleVisualisationModal } from '../actions'
import DatasetList from '../components/DatasetList'
import DatasetInput from '../components/DatasetInput'
import { Link } from 'react-router'
import Navigation from '../components/Navigation'

class Datasets extends Component {

  render() {
    // Injected by connect() call:
    const { dispatch, dataSets, router, visualisations, dashboards } = this.props;
    return (
      <div>
        <h1>Akvo DASH prototype</h1>
        <Navigation router={router}
        visualisations={visualisations}
        dashboards={dashboards} />
        <h2>Datasets</h2>
        <DatasetInput onSubmit={(url) =>
          dispatch(fetchDataset(url))
        }
        onSubmitDatasetName={(name) =>
          dispatch(saveDatasetName(name))
        }
        datasets={dataSets} />
        <DatasetList
        datasets={dataSets}
        visualisations={visualisations}
        requestDatasetGraph={(index) =>
          dispatch(requestDatasetGraph(index))
        }
        saveVisualisation={(data) =>
          dispatch(saveVisualisation(data))
        }
        toggleVisualisationModal={(setID) =>
          dispatch(toggleVisualisationModal(setID))
        }
        />
      </div>
    )
  }
}
/*
        <TodoList
          todos={visibleTodos}
          onTodoClick={index =>
            dispatch(completeTodo(index))
          } />
*/

// Which props do we want to inject, given the global state?
// Note: use https://github.com/faassen/reselect for better performance.
function select(state) {
  return state;
/*
  return {
    q: state.router.location.query.q
  }
*/
}

// Wrap the component to inject dispatch and state into it
export default connect(select)(Datasets)
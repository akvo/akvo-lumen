import React from 'react'
import { render } from 'react-dom'
import { createStore, compose, applyMiddleware } from 'redux'
import { Provider } from 'react-redux'
import Datasets from './containers/Datasets'
import Visualisations from './containers/Visualisations'
import Dashboards from './containers/Dashboards'
import todoApp from './reducers'
import { createHistory } from 'history'
import { reduxReactRouter, ReduxRouter } from 'redux-router'
import { Route } from 'react-router'
import { Component } from 'react'
import persistState from 'redux-localstorage'
import thunkMiddleware from 'redux-thunk'

const createStoreWithMiddleware = compose(
	applyMiddleware(thunkMiddleware),
	reduxReactRouter({ createHistory })
	)(createStore)
/*
let createPersistentStore = compose(
		reduxReactRouter({ createHistory }),
		persistState()
	)(createStore)	
*/

let store = createStoreWithMiddleware(todoApp);

let rootElement = document.querySelector('.root');

class Child extends Component {
	render() {
		return(
			<div>Child component :D</div>
		)
	}
}

render(
  <Provider store={store}>
	    <ReduxRouter>
	    	<Route path="/" component={Datasets}>
	    		<Route path="datasets" component={Datasets} />
	    	</Route>
    		<Route path="visualisations" component={Visualisations} />
    		<Route path="dashboards" component={Dashboards} />
		</ReduxRouter>
  </Provider>,
  rootElement
)
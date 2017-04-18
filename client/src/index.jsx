import React from 'react';
import { render } from 'react-dom';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import Root from './containers/Root';
import configureStore from './store/configureStore';
import * as auth from './auth';

function initAuthenticated(profile) {
  const initialState = { profile };

  const store = configureStore(initialState);
  const history = syncHistoryWithStore(browserHistory, store);
  const rootElement = document.querySelector('#root');
  render(<Root store={store} history={history} />, rootElement);
}

function initNotAuthenticated(msg) {
  document.querySelector('#root').innerHTML = msg;
}

auth.init()
  .then(profile => initAuthenticated(profile))
  .catch(err => initNotAuthenticated(err.message));

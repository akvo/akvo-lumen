import React from 'react';
import { render } from 'react-dom';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import Root from './containers/Root';
import configureStore from './store/configureStore';
import * as auth from './auth';

function initAuthenticated(profile, env) {
  const initialState = { profile, env };

  const store = configureStore(initialState);
  const history = syncHistoryWithStore(browserHistory, store);
  const rootElement = document.querySelector('#root');

  // Refreshing the token on a fixed schedule (every 10 minutes)
  // will disable SSO Idle Timeout
  setInterval(auth.token, 1000 * 60 * 10);

  render(<Root store={store} history={history} />, rootElement);
}

function initNotAuthenticated(msg) {
  document.querySelector('#root').innerHTML = msg;
}

auth.init()
  .then(({ profile, env }) => initAuthenticated(profile, env))
  .catch(err => initNotAuthenticated(err.message));

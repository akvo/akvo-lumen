import React from 'react';
import { render } from 'react-dom';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import Root from './containers/Root';
import configureStore from './store/configureStore';
import * as auth from './auth';

function initAuthenticated(profile) {
  const initialState = {
    user: {
      name: profile.username,
      organization: 'Akvo Lumen',
    },
  };

  const store = configureStore(initialState);
  const history = syncHistoryWithStore(browserHistory, store);
  const rootElement = document.querySelector('#root');
  render(<Root store={store} history={history} />, rootElement);
}

function initNotAuthenticated() {
  document.querySelector('#root').innerHTML = 'Authentication required.';
}

auth.init().then(
  kc => kc.init({ onLoad: 'login-required' }).success((authenticated) => {
    if (authenticated) {
      kc.loadUserProfile().success((profile) => {
        initAuthenticated(profile);
      }).error(() => {
        initNotAuthenticated();
      });
    } else {
      initNotAuthenticated();
    }
  }).error(() => {
    initNotAuthenticated();
  }
));

/* eslint-disable import/default, global-require, import/first, no-underscore-dangle */
import React from 'react';
import { render } from 'react-dom';
import { browserHistory } from 'react-router';
import { AppContainer } from 'react-hot-loader';
import { syncHistoryWithStore } from 'react-router-redux';
import Root from './containers/Root';
import configureStore from './store/configureStore';
import * as auth from './utilities/auth';
import { init as initAnalytics } from './utilities/analytics';
import queryString from 'querystringify';
import url from 'url';
import { get } from './utilities/api';
import Raven from 'raven-js';

function initAuthenticated(profile, env) {
  const initialState = { profile, env };

  const store = configureStore(initialState);
  const history = syncHistoryWithStore(browserHistory, store);
  const rootElement = document.querySelector('#root');

  store.subscribe(() => {
    initAnalytics(store.getState());
  });

  // Refreshing the token on a fixed schedule (every 10 minutes)
  // will disable SSO Idle Timeout
  setInterval(auth.token, 1000 * 60 * 10);

  render(
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>,
    rootElement
  );

  if (module.hot) {
    module.hot.accept('./containers/Root', () => {
      const NewRoot = require('./containers/Root').default;
      render(
        <AppContainer>
          <NewRoot store={store} history={history} />
        </AppContainer>,
        rootElement
      );
    });
  }
}

const locales = new Set(['en', 'es', 'fr']);
function userLocale(lo) {
  if (lo) {
    const l = lo.toLowerCase().substring(0, 2);
    if (locales.has(l)) {
      return l;
    }
  }
  return 'en';
}

function initWithAuthToken(locale) {
  const initialState = { profile: { admin: false, attributes: { locale: [userLocale(locale)] } } };
  const rootElement = document.querySelector('#root');
  const store = configureStore(initialState);
  const history = syncHistoryWithStore(browserHistory, store);

  render(
    <AppContainer>
      <Root store={store} history={history} />
    </AppContainer>,
    rootElement
  );
}

function initNotAuthenticated(msg) {
  document.querySelector('#root').innerHTML = msg;
}

function dispatchOnMode() {
  const queryParams = queryString.parse(location.search);
  const accessToken = queryParams.access_token;
  if (url.parse(location.href).pathname !== '/auth0_callback' && accessToken == null) {
    let authz = queryString.parse(location.search).auth;
    authz = authz ? { auth: authz } : null;
    get('/env', authz)
    .then(
      ({
        body,
      // eslint-disable-next-line consistent-return
      }) => {
        auth.init(body, auth.initService(body))
        .then(({ profile, env }) => initAuthenticated(profile, env))
        .catch(err => initNotAuthenticated(err.message));
      });
  } else if (accessToken != null) {
    auth.initExport(accessToken).then(initWithAuthToken(queryParams.locale));
  } else {
    get('/env', { auth: 'auth0' })
    .then(
      ({
        body,
      // eslint-disable-next-line consistent-return
      }) => {
        const auth0 = auth.initService(body);
        auth.setAuth0(auth0);
        // eslint-disable-next-line consistent-return
        auth0.parseHash({ hash: window.location.hash }, (err, authResult) => {
          if (err) {
            throw err;
          }

          // eslint-disable-next-line consistent-return
          auth0.client.userInfo(authResult.accessToken, (err2, user) => {
            if (err2) {
              throw err2;
            }
            // Now you have the user's information
            const userProfile = user;
            userProfile.admin = false;
            userProfile.firstName = user.firstName || user.given_name;
            userProfile.lastName = user.lastName || user.family_name;
            userProfile.attributes = user.attributes || { locale: [userLocale(user.locale)] };
            userProfile.username = user.username || user.nickname;
            if (process.env.NODE_ENV === 'production') {
              Raven.setUserContext(userProfile);
            }
            initAuthenticated(userProfile, body);
          });
        });
      });
  }
}

dispatchOnMode();


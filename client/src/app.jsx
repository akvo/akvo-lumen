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
  setInterval(auth.token, 1000 * 60 * 1);

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

// eslint-disable-next-line no-unused-vars
function initWithAuthToken(locale) {
  const initialState = { profile: { attributes: { locale: [locale] } } };
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

function dispatchOnMode() {
  const queryParams = queryString.parse(location.search);
  const accessToken = queryParams.access_token;
  console.log(queryParams, url.parse(location.href).pathname);

  if (url.parse(location.href).pathname !== '/auth0_callback' && accessToken == null) {
    const authz = queryString.parse(location.search).auth || 'keycloak';
    get('/env', { auth: authz })
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
    auth.initExport(accessToken).then(initAuthenticated(queryParams.locale));
  } else {
//    const idToken = queryString.parse(location.hash).id_token;
    console.log(queryString.parse(location.hash));
    get('/env', { auth: 'auth0' })
    .then(
      ({
        body,
      // eslint-disable-next-line consistent-return
      }) => {
        console.log('env auth0', body);
        const auth0 = auth.initService(body);
        auth.setAuth0(auth0);
        // eslint-disable-next-line consistent-return
        auth0.parseHash({ hash: window.location.hash }, (err, authResult) => {
          if (err) {
            return console.log(err);
          }

          // eslint-disable-next-line consistent-return
          auth0.client.userInfo(authResult.accessToken, (err2, user) => {
            // Now you have the user's information
            const userr = user;
            userr.admin = false;
            userr.firstName = user.firstName || user.given_name;
            userr.lastName = user.lastName || user.family_name;
            userr.attributes = user.attributes || { locale: [userLocale(user.locale)] };
            userr.username = user.username || user.nickname;
            if (err2) {
              return console.log(err2);
            }
            initAuthenticated(userr, body);
          });
        });
      });
  }
}

dispatchOnMode();


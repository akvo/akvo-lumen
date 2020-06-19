/* eslint-disable import/default, global-require, import/first, no-underscore-dangle */
import React from 'react';
import { render } from 'react-dom';
import jwtDecode from 'jwt-decode';
import { createBrowserHistory } from 'history';
import { AppContainer } from 'react-hot-loader';
import { syncHistoryWithStore } from 'react-router-redux';
import Error from './containers/Error';
import Root from './containers/Root';
import configureStore from './store/configureStore';
import * as auth from './utilities/auth';
import { init as initAnalytics } from './utilities/analytics';
import { UserManager, WebStorageStateStore } from 'oidc-client';
import queryString from 'querystringify';
import url from 'url';
import { get, getWithToken } from './utilities/api';
import Raven from 'raven-js';

function initAuthenticated(profile, env) {
  if (process.env.NODE_ENV === 'production') {
    Raven.setUserContext(profile);
  }

  const initialState = { profile, env };

  const store = configureStore(initialState);
  const customHistory = createBrowserHistory();
  const history = syncHistoryWithStore(customHistory, store);
  const rootElement = document.querySelector('#root');

  store.subscribe(() => {
    initAnalytics(store.getState());
  });

  // Refreshing the token on a fixed schedule (every 10 minutes)
  // will disable SSO Idle Timeout
  setInterval(auth.token, 1000 * 60 * 10);
  const q = JSON.stringify(queryString.parse(location.search));
  render(
    <AppContainer>
      <Root store={store} history={history} query={q} />
    </AppContainer>,
    rootElement
  );

  if (module.hot) {
    module.hot.accept('./containers/Root', () => {
      const NewRoot = require('./containers/Root').default;
      render(
        <AppContainer>
          <NewRoot store={store} history={history} query={q} />
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

function initNotAuthenticated(error) {
  const locale = userLocale(navigator.language);
  const initialState =
    { profile: { admin: false, attributes: { locale: [locale] } } };
  const rootElement = document.querySelector('#root');
  const store = configureStore(initialState);

  render(
    <Error store={store} error={error} locale={locale} />,
    rootElement
  );
}

function feedUserProfile(user, env, token) {
  const userProfile = user.profile;
  let fn = () => get('/api/user/profile', {
    email: userProfile.email,
  });
  if (token) {
    fn = () => getWithToken(token, '/api/user/profile', {
      email: userProfile.email,
    });
  }

  return Promise.resolve(
    fn().then((response) => {
      try {
        const {
          admin, firstName, id, lastName,
        } = response.body;
        userProfile.admin = admin;
        userProfile.firstName = firstName;
        userProfile.keycloakId = id;
        userProfile.lastName = lastName;
      } catch (e) {
        userProfile.admin = false;
        Raven.captureException(e, {
          extra: {
            user,
          },
        });
      }
      userProfile.attributes = user.attributes || { locale: [userLocale(user.locale)] };
      userProfile.username = user.username || user.nickname;
      return { profile: userProfile, env };
    }));
}

function dynamicEnv(res) {
  return Promise.resolve(
    get('/api/env').then(envresp => ({ profile: res.profile, env: Object.assign(res.env, envresp.body) }))
  );
}

function dispatchOnMode() {
  const queryParams = queryString.parse(location.search);
  const accessToken = queryParams.access_token;
  if (url.parse(location.href).pathname !== '/auth_callback' && accessToken == null) {
    get('/env')
    .then(
      ({
        body,
      // eslint-disable-next-line consistent-return
      }) => {
        auth.init(body, auth.initService(body.auth))
        // eslint-disable-next-line consistent-return
        .then((user) => {
          // auth0.authorize();
          if (user == null) {
            const redirect = url.parse(location.href).pathname;
            if (redirect !== '/library' && redirect !== '/') {
              window.localStorage.setItem('redirect', redirect);
            }
            auth.signinRedirect();
          } else {
            return feedUserProfile(user, body);
          }
        })
        .then(res => dynamicEnv(res))
        .then((res) => {
          if (res) {
            initAuthenticated(res.profile, res.env);
          }
        });
      });
  } else if (accessToken != null) {
    get('/env')
      .then(
        ({
        body,
      // eslint-disable-next-line consistent-return
        }) => {
          const q = queryString.parse(location.search);
          delete q.access_token;
          const p = jwtDecode(accessToken);
          const x = {
            profile: p,
            nickname: p.nickname,
          };
          return feedUserProfile(x, body, accessToken);
        }
      )
      .then(res => dynamicEnv(res))
      .then((res) => {
        auth.initExport(accessToken).then(initAuthenticated(res.profile, res.env));
      });
  } else {
    get('/env')
    .then(
      ({
        body,
      // eslint-disable-next-line consistent-return
      }) => {
        auth.initService(body.auth);
        const mgr = new UserManager({ userStore: new WebStorageStateStore() });
        mgr.signinRedirectCallback().then(() => {
          window.location.href = '../';
        }).catch((err) => {
          initNotAuthenticated(err.error_description);
        });
      });
  }
}

dispatchOnMode();

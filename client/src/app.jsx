/* eslint-disable import/default, global-require, import/first, no-underscore-dangle */
import React from 'react';
import { render } from 'react-dom';
import { browserHistory } from 'react-router';
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
import { get } from './utilities/api';
import Raven from 'raven-js';

function initAuthenticated(profile, env) {
  if (process.env.NODE_ENV === 'production') {
    Raven.setUserContext(profile);
  }

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
            auth.signinRedirect();
          } else {
            const userProfile = user.profile;
            return Promise.resolve(get('/api/user/profile', {
              email: user.profile.email,
            }).then((response) => {
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
              return { profile: userProfile, env: body };
            }));
          }
        })
        .then((res) => {
          if (res) {
            initAuthenticated(res.profile, res.env);
          }
        });
      });
  } else if (accessToken != null) {
    auth.initExport(accessToken).then(initWithAuthToken(queryParams.locale));
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

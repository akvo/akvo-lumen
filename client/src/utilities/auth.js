/* eslint-disable no-underscore-dangle */
import Keycloak from 'keycloak-js';
import Raven from 'raven-js';
import queryString from 'querystringify';

import { get } from './api';

let keycloak = null;
let accessToken = null;

export function token() {
  if (!keycloak) {
    return Promise.resolve(accessToken);
  }

  return new Promise(resolve =>
    keycloak
      .updateToken()
      .success(() => resolve(keycloak.token))
      .error(() => {
        // Redirect to login page
        keycloak.login();
      })
  );
}

export function refreshToken() {
  if (keycloak == null) {
    throw new Error('Keycloak not initialized');
  }
  return keycloak.refreshToken;
}

export function init() {
  if (keycloak != null) {
    throw new Error('Keycloak already initialized');
  }
  const auth = queryString.parse(location.search).auth || 'keycloak';
  return get('/env', { auth })
    .then(
      ({
        body: {
          keycloakClient,
          authURL,
          authProvider,
          tenant,
          sentryDSN,
          flowApiUrl,
          piwikSiteId,
          exporterUrl,
        },
      }) =>
        new Promise((resolve, reject) => {
          if (process.env.NODE_ENV === 'production') {
            Raven.config(sentryDSN).install();
            Raven.setExtraContext({ tenant });
          }

          const queryParams = queryString.parse(location.search);

          if (authProvider === 'keycloak') {
            keycloak = new Keycloak({
              url: authURL,
              realm: 'akvo',
              clientId: keycloakClient,
            });

            keycloak
            .init({
              onLoad: 'login-required',
              checkLoginIframe: false,
              token: queryParams.token,
              refreshToken: queryParams.refresh_token,
            })
            .success((authenticated) => {
              if (authenticated) {
                keycloak
                  .loadUserProfile()
                  .success((profile) => {
                    if (process.env.NODE_ENV === 'production') {
                      Raven.setUserContext(profile);
                    }
                    resolve({
                      profile: Object.assign({}, profile, {
                        admin: keycloak.hasRealmRole(`akvo:lumen:${tenant}:admin`),
                      }),
                      env: { flowApiUrl, authURL, piwikSiteId, exporterUrl },
                    });
                  })
                  .error(() => {
                    reject(new Error('Could not load user profile'));
                  });
              } else {
                reject(new Error('Could not authenticate'));
              }
            })
            .error(() => {
              reject(new Error('Login attempt failed'));
            });
          } else if (authProvider === 'auth0') {
            alert('auth0 selected');
          }
        })
    );
}

export function initPublic() {
  return get('/env')
    .then(({ body }) => ({ env: body }));
}

export function initExport(providedAccessToken) {
  return Promise.resolve((accessToken = providedAccessToken));
}

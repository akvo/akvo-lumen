import fetch from 'isomorphic-fetch';
import Keycloak from 'keycloak-js';
import Raven from 'raven-js';

let keycloak = null;

export function token() {
  if (keycloak == null) {
    throw new Error('Keycloak not initialized');
  }

  return new Promise((resolve, reject) =>
    keycloak.updateToken()
      .success(() => resolve(keycloak.token))
      .error(err => reject(err))
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
  return fetch('/env')
    .then(response => response.json())
    .then(({
      keycloakClient,
      keycloakURL,
      tenant,
      sentryDSN,
      flowApiUrl,
    }) => new Promise((resolve, reject) => {
      if (process.env.NODE_ENV === 'production') {
        Raven.config(sentryDSN).install();
        Raven.setExtraContext({ tenant });
      }
      keycloak = new Keycloak({
        url: keycloakURL,
        realm: 'akvo',
        clientId: keycloakClient,
      });
      keycloak.init({ onLoad: 'login-required', checkLoginIframe: false }).success((authenticated) => {
        if (authenticated) {
          keycloak.loadUserProfile().success((profile) => {
            if (process.env.NODE_ENV === 'production') {
              Raven.setUserContext(profile);
            }
            resolve({
              profile: Object.assign({}, profile, { admin: keycloak.hasRealmRole(`akvo:lumen:${tenant}:admin`) }),
              env: { flowApiUrl },
            });
          }).error(() => {
            reject(new Error('Could not load user profile'));
          });
        } else {
          reject(new Error('Could not authenticate'));
        }
      }).error(() => {
        reject(new Error('Login attempt failed'));
      });
    }
  ));
}

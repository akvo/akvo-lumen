import fetch from 'isomorphic-fetch';
import Keycloak from 'keycloak-js';

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

export function init() {
  if (keycloak != null) {
    throw new Error('Keycloak already initialized');
  }
  return fetch('/env')
    .then(response => response.json())
    .then(({ keycloakURL }) => new Keycloak({
      url: keycloakURL,
      realm: 'akvo',
      clientId: 'lumen',
    }))
    .then(kc => new Promise((resolve, reject) =>
      kc.init({ onLoad: 'login-required' }).success((authenticated) => {
        if (authenticated) {
          kc.loadUserProfile().success((profile) => {
            keycloak = kc;
            resolve(profile);
          }).error(() => {
            reject('Could not load user profile');
          });
        } else {
          reject('Could not authenticate');
        }
      }).error(() => {
        reject('Login attempt failed');
      })
  ));
}

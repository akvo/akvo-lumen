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
    .then(({ keycloakURL }) => {
      keycloak = new Keycloak({
        url: keycloakURL,
        realm: 'akvo',
        clientId: 'akvo-lumen',
      });
      return keycloak;
    }
  );
}

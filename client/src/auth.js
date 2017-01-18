import fetch from 'isomorphic-fetch';
import Keycloak from 'keycloak-js';

let keycloak = null;

export default function () {
  if (keycloak != null) {
    return new Promise(resolve => resolve(keycloak));
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

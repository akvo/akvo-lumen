/* eslint-disable no-underscore-dangle */
import Keycloak from 'keycloak-js';
import Auth0 from 'auth0-js';
import queryString from 'querystringify';
import url from 'url';
import * as k from './keycloak';

import { get } from './api';

let keycloak = null;
let auth0 = null;
let accessToken = null;

function service() {
  if (keycloak) {
    return keycloak;
  }
  return auth0;
}
function lib() {
  if (keycloak) {
    return k;
  }
  return null;
}

export function token() {
  if (!service()) {
    return Promise.resolve(accessToken);
  }
  return lib().token(service());
}

export function refreshToken() {
  if (service() == null) {
    throw new Error('Auth not initialized');
  }
  return lib().refreshToken(service());
}

export function init() {
  if (keycloak != null) {
    throw new Error('Keycloak already initialized');
  }
  const auth = queryString.parse(location.search).auth || 'keycloak';
  return get('/env', { auth })
    .then(
      ({
        body,
      // eslint-disable-next-line consistent-return
      }) => {
        const {
          keycloakClient,
          authProvider,
          authURL,
        } = body;
        if (authProvider === 'keycloak') {
          if (keycloak != null) {
            throw new Error('Keycloak already initialized');
          }
          keycloak = new Keycloak({
            url: authURL,
            realm: 'akvo',
            clientId: keycloakClient,
          });
          keycloak.token = k.token;
          return k.init(body, keycloak);
        } else if (authProvider === 'auth0') {
          auth0 = new Auth0.WebAuth({
            domain: url.parse(authURL).host,
            clientID: 'kU4u9d2IJIMXnTGUe7WZ7ITi9c7VN0An',
            redirectUri: 'http://t1.lumen.local:3030/auth0/callback',
            responseType: 'token id_token',
            audience: 't1.lumen.local:3030',
            scope: 'openid email',
          });
          auth0.authorize();
        }
      }
    );
}

export function initPublic() {
  return get('/env')
    .then(({ body }) => ({ env: body }));
}

export function initExport(providedAccessToken) {
  return Promise.resolve((accessToken = providedAccessToken));
}

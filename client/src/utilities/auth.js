/* eslint-disable no-underscore-dangle */
import Raven from 'raven-js';
import Auth0 from 'auth0-js';
import url from 'url';
import { get } from './api';

let auth0 = null;
let accessToken = null;


export function setAuth0(A) {
  auth0 = A;
}

export function logout() {
  auth0.logout({ returnTo: `${location.protocol}//${location.host}` });
}

export function token() {
  if (!auth0) {
    return Promise.resolve(accessToken);
  }
  return new Promise((resolve) => {
    auth0.checkSession({}, (err, authResult) => {
      if (authResult) {
        resolve(authResult.idToken);
      } else if (err !== null) {
        logout(auth0);
      }
    });
  });
}

export function initService(env) {
  const {
    authClientId,
    authURL,
  } = env;
  return new Auth0.WebAuth({
    domain: url.parse(authURL).host,
    clientID: authClientId,
    redirectUri: `${location.protocol}//${location.host}/auth0_callback`,
    responseType: 'token id_token',
    scope: 'openid email profile',
    audience: `${authURL}/userinfo`,
    connection: 'google-oauth2',
  });
}

export function init(env, s) {
  const { tenant, sentryDSN } = env;
  if (process.env.NODE_ENV === 'production') {
    Raven.config(sentryDSN).install();
    Raven.setExtraContext({ tenant });
  }
  auth0 = s;
  auth0.authorize();
  return new Promise(() => null);
}
/*
export function login(auth0) {
  if (auth0 == null) {
    throw new Error('auth0 not initialized');
  }
  return auth0.authorize();
  }
 */

export function initPublic() {
  return get('/env')
    .then(({ body }) => ({ env: body }));
}

export function initExport(providedAccessToken) {
  return Promise.resolve((accessToken = providedAccessToken));
}

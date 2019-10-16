/* eslint-disable no-underscore-dangle */
import Raven from 'raven-js';
import Auth0 from 'auth0-js';
import url from 'url';
import * as a0 from './auth0';
import { get } from './api';

let auth0 = null;
let accessToken = null;

function service() {
  return auth0;
}


export function setAuth0(A) {
  auth0 = A;
}

function lib() {
  return a0;
}

export function logout() {
  lib().logout(service());
}

export function token() {
  if (!service()) {
    return Promise.resolve(accessToken);
  }
  return lib().token(service());
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

export function initPublic() {
  return get('/env')
    .then(({ body }) => ({ env: body }));
}

export function initExport(providedAccessToken) {
  return Promise.resolve((accessToken = providedAccessToken));
}

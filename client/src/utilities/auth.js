/* eslint-disable no-underscore-dangle */
import Raven from 'raven-js';
import { UserManager, WebStorageStateStore } from 'oidc-client';
import url from 'url';
import { get } from './api';

let auth0 = null;
let accessToken = null;


export function setAuth0(A) {
  auth0 = A;
}
export function getUserManager() {
  return auth0;
}


export function logout() {
  auth0.logout({ returnTo: `${location.protocol}//${location.host}` });
}

export function token() {
  if (!auth0) {
    return Promise.resolve(accessToken);
  }
  return new Promise((resolve) => {
    auth0.getUser().then((user) => {
      // auth0.authorize();
      console.log('yuhu user', user);
      if (user == null) {
        auth0.signinRedirect();
      } else {
        resolve(user.id_token);
      }
    });
  });
}

export function initService(env) {
  const {
    authClientId,
    authURL,
  } = env;
  const AUTH0_DOMAIN = `https://${url.parse(authURL).host}`;
  console.log('AUTH0_DOMAIN', AUTH0_DOMAIN);
  const settings = {
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    authority: AUTH0_DOMAIN,
    client_id: authClientId,
    redirect_uri: `${location.protocol}//${location.host}/auth0_callback`,
    response_type: 'id_token token',
    scope: 'openid profile email',
    post_logout_redirect_uri: 'http://localhost:8080/',
    filterProtocolClaims: true,
    metadata: {
      issuer: `${AUTH0_DOMAIN}/`,
      authorization_endpoint: `${AUTH0_DOMAIN}/authorize`,
      userinfo_endpoint: `${AUTH0_DOMAIN}/userinfo`,
      end_session_endpoint: `${AUTH0_DOMAIN}/v2/logout`,
      jwks_uri: `${AUTH0_DOMAIN}/.well-known/jwks.json`,
    },
  };
  const userManager = new UserManager(settings);
  return userManager;
}

export function init(env, s) {
  const { tenant, sentryDSN } = env;
  if (process.env.NODE_ENV === 'production') {
    Raven.config(sentryDSN).install();
    Raven.setExtraContext({ tenant });
  }
  auth0 = s;
  setAuth0(s);
  return auth0.getUser();
}

/*
export function login(a) {
  if (a == null) {
    throw new Error('auth0 not initialized');
  }
  return a.authorize();
}
*/
export function initPublic() {
  return get('/env')
    .then(({ body }) => ({ env: body }));
}

export function initExport(providedAccessToken) {
  return Promise.resolve((accessToken = providedAccessToken));
}

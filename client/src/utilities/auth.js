/* eslint-disable no-underscore-dangle */
import Raven from 'raven-js';
import { UserManager, WebStorageStateStore } from 'oidc-client';
import url from 'url';
import { get } from './api';

let userManager = null;
let accessToken = null;

export function logout() {
  userManager.signoutRedirect();
}

export function signinRedirect() {
  userManager.signinRedirect();
}

export function token() {
  if (!userManager) {
    return Promise.resolve(accessToken);
  }
  return new Promise((resolve) => {
    userManager.getUser().then((user) => {
      // userManager.authorize();
      console.log('yuhu user', user);
      if (user == null) {
        userManager.signinRedirect();
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
  const DOMAIN = `https://${url.parse(authURL).host}`;
  console.log('DOMAIN', DOMAIN);
  const settings = {
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    authority: DOMAIN,
    client_id: authClientId,
    redirect_uri: `${location.protocol}//${location.host}/auth_callback`,
    response_type: 'id_token token',
    scope: 'openid profile email',
    post_logout_redirect_uri: `${location.protocol}//${location.host}`,
    filterProtocolClaims: true,
    metadata: {
      issuer: `${DOMAIN}/`,
      authorization_endpoint: `${DOMAIN}/authorize`,
      userinfo_endpoint: `${DOMAIN}/userinfo`,
      end_session_endpoint: `${DOMAIN}/v2/logout?returnTo=${location.protocol}//${location.host}`,
      jwks_uri: `${DOMAIN}/.well-known/jwks.json`,
    },
  };
  return new UserManager(settings);
}

export function init(env, s) {
  const { tenant, sentryDSN } = env;
  if (process.env.NODE_ENV === 'production') {
    Raven.config(sentryDSN).install();
    Raven.setExtraContext({ tenant });
  }
  userManager = s;
  return userManager.getUser();
}

export function initPublic() {
  return get('/env')
    .then(({ body }) => ({ env: body }));
}

export function initExport(providedAccessToken) {
  return Promise.resolve((accessToken = providedAccessToken));
}

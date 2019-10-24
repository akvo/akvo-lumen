/* eslint-disable no-underscore-dangle */
import Raven from 'raven-js';
import { UserManager, WebStorageStateStore } from 'oidc-client';
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
    clientId,
    domain,
    endpoints,
  } = env;
  const { issuer, authorization, userinfo, endSession, jwksUri } = endpoints;
  const settings = {
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    authority: domain,
    client_id: clientId,
    redirect_uri: `${location.protocol}//${location.host}/auth_callback`,
    response_type: 'id_token token',
    scope: 'openid profile email',
    post_logout_redirect_uri: `${location.protocol}//${location.host}`,
    filterProtocolClaims: true,
    metadata: {
      issuer: `${domain}${issuer}`,
      authorization_endpoint: `${domain}${authorization}`,
      userinfo_endpoint: `${domain}${userinfo}`,
      end_session_endpoint: `${domain}${endSession}?returnTo=${location.protocol}//${location.host}`,
      jwks_uri: `${domain}${jwksUri}`,
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

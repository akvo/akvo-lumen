/* eslint-disable no-underscore-dangle */
import Raven from 'raven-js';
import queryString from 'querystringify';

export function token(keycloak) {
  return new Promise(resolve =>
    keycloak
      .updateToken()
      .success(() => resolve(keycloak.token))
      .error(() => {
        // Redirect to login page
        keycloak.login();
      })
  );
}

export function refreshToken(keycloak) {
  if (keycloak == null) {
    throw new Error('Keycloak not initialized');
  }
  return keycloak.refreshToken;
}
export function login(keycloak) {
  if (keycloak == null) {
    throw new Error('Keycloak not initialized');
  }
  return keycloak.login();
}

export function init(env, keycloak) {
  const { tenant, sentryDSN } = env;
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'production') {
      Raven.config(sentryDSN).install();
      Raven.setExtraContext({ tenant });
    }

    const queryParams = queryString.parse(location.search);
    keycloak
    .init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      token: queryParams.token,
      refreshToken: queryParams.refresh_token,
    })
    .success((authenticated) => {
      if (authenticated) {
        keycloak
          .loadUserProfile()
          .success((profile) => {
            if (process.env.NODE_ENV === 'production') {
              Raven.setUserContext(profile);
            }
            console.log('profile', profile);
            resolve({
              profile: Object.assign({}, profile, {
                admin: keycloak.hasRealmRole(`akvo:lumen:${tenant}:admin`),
              }),
              env,
            });
          })
          .error(() => {
            reject(new Error('Could not load user profile'));
          });
      } else {
        reject(new Error('Could not authenticate'));
      }
    })
    .error(() => {
      reject(new Error('Login attempt failed'));
    });
  });
}


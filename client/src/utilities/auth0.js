/* eslint-disable no-underscore-dangle */

export function token(auth0) {
  return new Promise((resolve) => {
    auth0.checkSession({}, (err, authResult) => {
      resolve(authResult.idToken);
    });
  });
}

export function logout(auth0) {
  auth0.logout({ returnTo: `${location.protocol}//${location.host}` });
}

// eslint-disable-next-line no-unused-vars
export function refreshToken(auht0) {
  throw new Error('auth0 dont have refresh-tokens');
}

export function login(auth0) {
  if (auth0 == null) {
    throw new Error('auth0 not initialized');
  }
  return auth0.authorize();
}

// eslint-disable-next-line no-unused-vars
export function init(env, auth0) {

}


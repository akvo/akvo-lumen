/* eslint-disable no-underscore-dangle */
// import Raven from 'raven-js';
// import queryString from 'querystringify';
// import Auth0 from 'auth0-js';
// import url from 'url';

export function token(auth0) {
  return new Promise((resolve) => {
    console.log('auth0', auth0.client);
    console.log(location);
    auth0.checkSession({}, (err, authResult) => {
      console.log('checkSessionerr', err);
      console.log('checkSession', authResult);
      resolve(authResult.idToken);
    });
  });
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


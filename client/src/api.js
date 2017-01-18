import fetch from 'isomorphic-fetch';
import keycloak from './auth';

function wrapUpdateToken(fetchRequestThunk) {
  return new Promise(
    (resolve, reject) => (
      keycloak().then(kc => kc.updateToken()
        .success(() =>
          fetchRequestThunk(kc.token)
            .then(response => response.json())
            .then(response => resolve(response))
            .catch(err => reject(err)))
        .error(err => reject(err))
    ))
  );
}

function requestHeaders(token, additionalHeaders = {}) {
  return Object.assign({}, additionalHeaders, {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });
}

export function get(url, headers) {
  return wrapUpdateToken(token => fetch(url, {
    method: 'GET',
    headers: requestHeaders(token, headers),
  }));
}

export function post(url, body, headers) {
  return wrapUpdateToken(token =>
    fetch(url, {
      method: 'POST',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  );
}

export function put(url, body, headers) {
  return wrapUpdateToken(token =>
    fetch(url, {
      method: 'PUT',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  );
}

export function del(url, headers) {
  return wrapUpdateToken(token =>
    fetch(url, {
      method: 'DELETE',
      headers: requestHeaders(token, headers),
    })
  );
}

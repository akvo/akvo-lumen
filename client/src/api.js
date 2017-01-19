import fetch from 'isomorphic-fetch';
import * as auth from './auth';

function wrapUpdateToken(fetchRequestThunk) {
  return auth.token()
    .then(token => fetchRequestThunk(token))
    .then(response => response.json());
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

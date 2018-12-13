// import fetch from 'whatwg-fetch';
import { omit } from 'lodash';

import * as auth from './auth';

function wrapUpdateToken(fetchRequestThunk) {
  return auth.token()
    .then(token => fetchRequestThunk(token));
}

function requestHeaders(token, additionalHeaders = {}) {
  return Object.assign({}, additionalHeaders, {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });
}

function getQueryString(queryParams) {
  return Object.keys(queryParams).map((key, index) =>
    `${index > 0 ? '&' : ''}${key}=${encodeURIComponent(queryParams[key])}`
  ).join('');
}

export function get(url, queryParams, headers) {
  const urlWithOptionalParams = queryParams == null ? url : `${url}?${getQueryString(queryParams)}`;
  return wrapUpdateToken(token =>
    fetch(urlWithOptionalParams, {
      method: 'GET',
      headers: omit(requestHeaders(token, headers), 'Content-Type'),
    })
  );
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

export function patch(url, body, headers) {
  return wrapUpdateToken(token =>
    fetch(url, {
      method: 'PATCH',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  );
}

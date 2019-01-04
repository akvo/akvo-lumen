import { omit } from 'lodash';

import * as auth from './auth';

const wrapUpdateToken = callback => auth.token().then(token => callback(token));

const requestHeaders = (token, additionalHeaders = {}) => ({
  ...additionalHeaders,
  'Content-Type': 'application/json',
  Authorization: `Bearer ${token}`,
});

const getQueryString = queryParams =>
  Object.keys(queryParams).map((key, index) =>
    `${index > 0 ? '&' : ''}${key}=${encodeURIComponent(queryParams[key])}`
  ).join('');

export const get = (url, queryParams, headers) => {
  const urlWithOptionalParams = queryParams == null ? url : `${url}?${getQueryString(queryParams)}`;
  return wrapUpdateToken(token =>
    fetch(urlWithOptionalParams, {
      method: 'GET',
      headers: omit(requestHeaders(token, headers), 'Content-Type'),
    })
  );
};

export const post = (url, body, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'POST',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  );

export const put = (url, body, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'PUT',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  );

export const del = (url, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'DELETE',
      headers: requestHeaders(token, headers),
    })
  );

export const patch = (url, body, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'PATCH',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  );


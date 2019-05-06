import { omit } from 'lodash';
import Raven from 'raven-js';

import * as auth from './auth';

const CONTENT_TYPE = {
  JSON: 'json',
};

const wrapUpdateToken = callback => auth.token().then(token => callback(token));

const iteratorToObject = (iterator) => {
  const result = {};
  iterator.forEach((value, key) => {
    result[key] = value;
  });
  return result;
};

const getContentType = (contentType) => {
  if (contentType.indexOf('application/json') > -1) {
    return CONTENT_TYPE.JSON;
  }
  return null;
};

const handleResponse = (response) => {
  const {
    ok,
    redirected,
    status,
    statusText,
    type,
    url,
    useFinalURL,
    bodyUsed,
  } = response;

  const headers = iteratorToObject(response.headers);
  const contentType = getContentType(headers['content-type']);

  if (!ok) {
    switch (status) {
      case 400: {
        return response.json().then((body) => {
          const error = new Error(`Bad request${body.message ? `: ${body.message}` : ''}`);
          Raven.captureException(error, {
            extra: {
              url,
              body,
              status,
            },
          });
          throw error;
        });
      }
      case 409: {
        return response.json().then((body) => {
          throw new Error(body.error);
        });
      }
      case 404:
      case 500: {
        const error = new Error(statusText);
        Raven.captureException(error, {
          extra: {
            url,
            status,
          },
        });
        throw error;
      }
      default : {
        const error = new Error('There was an error communicating with the server.');
        Raven.captureException(error, {
          extra: {
            url,
            status,
          },
        });
        throw error;
      }
    }
  }

  switch (contentType) {
    case CONTENT_TYPE.JSON: {
      return response.json().then(body => ({
        headers,
        ok,
        redirected,
        status,
        statusText,
        type,
        url,
        useFinalURL,
        bodyUsed,
        body,
      }));
    }
    default: {
      return response;
    }
  }
};

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
  )
  .then(handleResponse);
};

export const post = (url, body, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'POST',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  )
  .then(handleResponse);

export const put = (url, body, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'PUT',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  )
  .then(handleResponse);

export const del = (url, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'DELETE',
      headers: requestHeaders(token, headers),
    })
  )
  .then(handleResponse);

export const patch = (url, body, headers) =>
  wrapUpdateToken(token =>
    fetch(url, {
      method: 'PATCH',
      headers: requestHeaders(token, headers),
      body: JSON.stringify(body),
    })
  )
  .then(handleResponse);

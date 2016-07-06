import fetch from 'isomorphic-fetch';
import headers from './actions/headers';

export function get(url) {
  return fetch(url, {
    method: 'GET',
    headers: headers(),
  }).then(response => response.json());
}

export function post(url, body) {
  return fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  }).then(response => response.json());
}

export function put(url, body) {
  return fetch(url, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(body),
  }).then(response => response.json());
}

export function del(url) {
  return fetch(url, {
    method: 'DELETE',
    headers: headers(),
  }).then(response => response.json());
}

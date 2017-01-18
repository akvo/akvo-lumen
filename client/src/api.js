import fetch from 'isomorphic-fetch';
import headers from './actions/headers';
import keycloak from './auth';

function wrapUpdateToken(fetchRequestThunk) {
  return new Promise(
    (resolve, reject) => (
      keycloak().then(kc => kc.updateToken()
        .success(() =>
          fetchRequestThunk()
            .then(response => resolve(response.json()))
            .catch(err => reject(err)))
        .error(err => reject(err))
    ))
  );
}

export function get(url) {
  return wrapUpdateToken(() => fetch(url, {
    method: 'GET',
    headers: headers(),
  }));
}

export function post(url, body) {
  return wrapUpdateToken(() =>
    fetch(url, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(body),
    })
  );
}

export function put(url, body) {
  return wrapUpdateToken(() =>
    fetch(url, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify(body),
    })
  );
}

export function del(url) {
  return wrapUpdateToken(() =>
    fetch(url, {
      method: 'DELETE',
      headers: headers(),
    })
  );
}

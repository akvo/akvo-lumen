import keycloak from '../auth';

// Common headers for all api calls
export default function headers(hs = {}) {
  return Object.assign({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${keycloak.token}`,
  },
  hs);
}

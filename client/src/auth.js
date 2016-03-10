import Keycloak from 'keycloak-js';

export default new Keycloak({
  url: 'https://login.test.akvo-ops.org/auth',
  realm: 'akvo',
  clientId: 'akvo-dash',
});

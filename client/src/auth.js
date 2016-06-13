import Keycloak from 'keycloak-js';

export default new Keycloak({
  url: 'http://localhost:8080/auth',
  realm: 'akvo',
  clientId: 'akvo-lumen',
});

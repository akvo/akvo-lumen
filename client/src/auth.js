import Keycloak from 'keycloak-js';

export default new Keycloak({
  url: process.env.LUMEN_KEYCLOAK_URL || 'http://localhost:8080/auth',
  realm: 'akvo',
  clientId: 'akvo-lumen',
});

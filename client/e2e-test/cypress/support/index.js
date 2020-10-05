const baseUrl = Cypress.env('LUMEN_URL') || 'http://t1.lumen.local:3030/';
const auth = Cypress.env('LUMEN_AUTH') || 'keycloak';

// for keycloak login
const username = Cypress.env('LUMEN_USER') || 'jerome@t1.akvolumen.org';
const password = Cypress.env('LUMEN_PASSWORD') || 'password';

// for auth0 login
const auth_client_id = Cypress.env('LUMEN_AUTH_CLIENT_ID');
const auth_client_password = Cypress.env('LUMEN_AUTH_CLIENT_PASSWORD');

Cypress.Commands.add('login', () => {
  if (auth === 'keycloak') {  // login with keycloak
    cy.visit(baseUrl);

    cy.get('#username')
      .type(username)
      .should('have.value', username);

    cy.get('#password')
      .type(password)
      .should('have.value', password);

    cy.get('#kc-login').click();
  } else { // login with auth0
    Cypress.log({ name: 'loginViaAuth0' });

    const options = {
      method: 'POST',
      url: 'https://akvotest.eu.auth0.com/oauth/token',
      body: {
        grant_type: 'password',
        username,
        password,
        audience: 'https://akvotest.eu.auth0.com/api/v2/',
        scope: 'openid profile email',
        client_id: auth_client_id,
        client_secret: auth_client_password,
      },
    };

    cy.request(options).then(resp => resp.body).then((body) => {
      const { id_token } = body;

      cy.visit(`${baseUrl}?access_token=${id_token}&edit_user=false`);
    });
  }
});

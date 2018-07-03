const baseUrl = Cypress.env("LUMEN_URL") || 'http://t1.lumen.local:3030/';
const username = Cypress.env("LUMEN_USER") || 'jerome';
const password = Cypress.env("LUMEN_PASSWORD") || 'password';
const DATASET_LINK = 'https://github.com/lawlesst/vivo-sample-data/raw/master/data/csv/people.csv';
const datasetName = `Dataset ${Date.now().toString()}`;

context('Kitchen Sink', () => {
  before(() => {
    cy.visit(baseUrl);
    cy.get('#username')
      .type(username)
      .should('have.value', username);
    cy.get('#password')
      .type(password)
      .should('have.value', password);
    cy.get('#kc-login').click();
  });

  after(() => {
    const tryDelete = () => {
      cy.get('.LibraryListingItem').filter(`:contains(${datasetName})`).each((el, i) => {
        if(i > 0) return;
        cy.wrap(el)
          .find('[data-test-id="show-controls"]')
          .click({ force: true });
        cy.wrap(el)
          .find('[data-test-id="delete"]')
          .click({ force: true });
        cy.get('.DeleteConfirmationModal button.delete')
          .click();
        setTimeout(5000, tryDelete);
      })
    };
    tryDelete();
  });

  it('create dataset: link', () => {
    cy.get('button[data-test-id="dataset"]').click();
    // Select link option
    cy.get('input[data-test-id="source-option"][value="LINK"]').click();
    cy.get('button[data-test-id="next"]').click();
    cy.get('#linkFileInput').type(DATASET_LINK);
    cy.get('button[data-test-id="next"]').click();
    // Insert name
    cy.get('input[data-test-id="dataset-name"]').type(datasetName);
    // Import
    cy.get('button[data-test-id="next"]').click();
    cy.get(`[data-test-name="${datasetName}"]:not(.PENDING)`, { timeout: 20000 }).should('exist');
  });

  it('create visualisation', () => {
    cy.get('button[data-test-id="visualisation"]').click();
    cy.get('li[data-test-id="button-pivot-table"]', { timeout: 20000 }).click();
    cy.get('[data-test-id="dataset-menu"] .Select-control').click();
    // Finding dataset option
    cy.get('[role="option"]')
      .contains(datasetName)
      .should('have.attr', 'id')
      .then(optionId => {
        // Selecting dataset
        cy.get(`#${optionId}`).click();
        // open column menu
        cy.get('[data-test-id="column-menu"] .Select-control').click();
        // Finding column to select
        return cy.get('[role="option"]')
          .contains('title (text)')
          .should('have.attr', 'id');
      })
      .then(columnId => {
        const title = `Visualisation of ${datasetName}`;
        // Selecting column
        cy.get(`#${columnId}`).click();
        // Focusing title
        cy.get('div[data-test-id="entity-title"]').click();
        // Typing visualisation name
        cy.get('input[data-test-id="entity-title"]').type(title);
        // Saving visualisation
        cy.get('body').click();
        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // back to library
        cy.get('[data-test-id="back-button"]').click();
      });
  });

  it('create dashboard', () => {
    cy.get('button[data-test-id="dashboard"]', { timeout: 20000 }).click();
    // Selecting visualisation
    cy.get(`[data-test-name="Visualisation of ${datasetName}"]`).click();
    // Typing dashboard name
    cy.get('div[data-test-id="entity-title"]').click();
    cy.get('input[data-test-id="entity-title"]').type(`Dashboard of ${datasetName}`);
    // Saving dashboard
    cy.get('body').click();
    // back to library
    cy.get('[data-test-id="back-button"]').click();
  });
});

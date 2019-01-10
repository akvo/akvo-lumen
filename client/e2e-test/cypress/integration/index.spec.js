/* global cy, before, context, Cypress, after, it */
const baseUrl = Cypress.env('LUMEN_URL') || 'http://t1.lumen.local:3030/';
const username = Cypress.env('LUMEN_USER') || 'jerome';
const password = Cypress.env('LUMEN_PASSWORD') || 'password';
const DATASET_LINK = 'https://raw.githubusercontent.com/akvo/akvo-lumen/develop/client/e2e-test/sample-data-1.csv';
const datasetName = `Dataset ${Date.now().toString()}`;
const COLUMNS = {
  TEXT_1: 'Name',
  CAT_1: 'Cat',
  NUMBER_1: 'Age',
  NUMBER_2: 'Humidity',
  NUMBER_3: 'Score',
  NUMBER_4: 'Temperature',
};

context('Akvo Lumen', () => {
  // login
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

  // delete entities created during test
  after(() => {
    const tryDelete = () => {
      cy.get('.LibraryListingItem').filter(`:contains(${datasetName})`).each((el, i) => {
        if (i > 0) return;
        cy.wrap(el)
          .find('[data-test-id="show-controls"]')
          .click({ force: true });
        cy.wrap(el)
          .find('[data-test-id="delete"]')
          .click({ force: true });
        cy.get('.DeleteConfirmationModal button.delete')
          .click();
        setTimeout(5000, tryDelete);
      });
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
    cy.get(`[data-test-name="${datasetName}"] > a`).click({ force: true });
    // see if metadata is correct
    cy.get('.columnCount').contains('6 Columns').should('exist');
    cy.get('.rowCount').contains('4 Rows').should('exist');
    // see if table cells exist
    cy.get('.fixedDataTableCellLayout_main').should('have.length.of.at.least', 4);
    // back to library
    cy.get('[data-test-id="back-button"]').click();
  });

  it('create visualisation (pivot table)', () => {
    cy.get('button[data-test-id="visualisation"]').click();
    cy.get('[data-test-id="visualisation-type-pivot-table"]', { timeout: 20000 }).click();
    cy.get('[data-test-id="dataset-menu"] .Select-control').click();
    // Finding dataset option
    cy.get('[role="option"]')
      .contains(datasetName)
      .should('have.attr', 'id')
      .then((optionId) => {
        // Selecting dataset
        cy.get(`#${optionId}`).click();
        // open column menu
        cy.get('[data-test-id="column-select"] .Select-control').click();
        // Finding column to select
        return cy.get('[role="option"]')
          .contains(COLUMNS.TEXT_1)
          .should('have.attr', 'id');
      })
      .then((columnId) => {
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

        // pivot table elements exist
        cy.get('.PivotTable .title').contains(title).should('exist');
        cy.get('.PivotTable th').contains('Bob').should('exist');
        cy.get('.PivotTable th').contains('Jane').should('exist');
        cy.get('.PivotTable th').contains('Frank').should('exist');
        cy.get('.PivotTable th').contains('Lisa').should('exist');
        cy.get('.PivotTable td').contains('Total').should('exist');
        cy.get('.PivotTable td.cell').contains('1').should('exist');
        cy.get('.PivotTable .categoryColumnTitle').contains(COLUMNS.TEXT_1).should('exist');

        // back to library
        cy.get('[data-test-id="back-button"]').click();
      });
  });

  it('create visualisation from dataset page', () => {
    cy.get('.dataset').contains(datasetName).click({ force: true });
    cy.get('button[data-test-id="visualise"]').click({ force: true });
    cy.get('[data-test-id="visualisation-type-pivot-table"]', { timeout: 20000 }).click();
    cy.get('[data-test-id="dataset-menu"] .Select-control').click();
    // Finding dataset option
    cy.get('[role="option"]')
      .contains(datasetName)
      .should('have.attr', 'id')
      .then((optionId) => {
        // Selecting dataset
        cy.get(`#${optionId}`).click();
        // open column menu
        cy.get('[data-test-id="column-select"] .Select-control').click();
        // Finding column to select
        return cy.get('[role="option"]')
          .contains(COLUMNS.TEXT_1)
          .should('have.attr', 'id');
      })
      .then((columnId) => {
        const title = `Visualisation of ${datasetName} 2`;
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

        // pivot table elements exist
        cy.get('.PivotTable .title').contains(title).should('exist');
        cy.get('.PivotTable th').contains('Bob').should('exist');
        cy.get('.PivotTable th').contains('Jane').should('exist');
        cy.get('.PivotTable th').contains('Frank').should('exist');
        cy.get('.PivotTable th').contains('Lisa').should('exist');
        cy.get('.PivotTable td').contains('Total').should('exist');
        cy.get('.PivotTable td.cell').contains('1').should('exist');
        cy.get('.PivotTable .categoryColumnTitle').contains(COLUMNS.TEXT_1).should('exist');

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

    // visualization has been added
    cy.get('[data-test-id="dashboard-canvas-item"] h2').contains(`Visualisation of ${datasetName}`);
    cy.get('[data-test-id="dashboard-canvas-item"] .PivotTable').should('exist');

    // back to library
    cy.get('[data-test-id="back-button"]').click();
  });

  it('change visualization types', () => {
    cy.get('button[data-test-id="visualisation"]').click();

    // Area
    cy.get('[data-test-id="visualisation-type-area"]', { timeout: 20000 }).click();
    cy.get('[data-test-id="dataset-menu"] .Select-control').click();

    // Finding dataset option
    cy.get('[role="option"]')
      .contains(datasetName)
      .should('have.attr', 'id')
      .then((optionId) => {
        // Selecting dataset
        cy.get(`#${optionId}`).click();
      })

      .then(() => {
        // open x axis menu
        cy.get('[data-test-id="x-axis-select"] .Select-control').click();
        // Finding column to select
        cy.get('[role="option"]')
          .contains(COLUMNS.NUMBER_1)
          .click();

          // open y axis menu
        cy.get('[data-test-id="y-axis-select"] .Select-control').click();
        // Finding column to select
        cy.get('[role="option"]')
          .contains(COLUMNS.NUMBER_2)
          .click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.Chart .vx-line').should('exist');
      })

      .then(() => {
        // Line
        cy.get('[data-test-id="visualisation-type-line"]', { timeout: 20000 }).click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.Chart .vx-line').should('exist');
      })

      .then(() => {
        // Scatter
        cy.get('[data-test-id="visualisation-type-scatter"]', { timeout: 20000 }).click();

        cy.get('.Chart circle').should('exist');

        // open bucket menu
        cy.get('[data-test-id="category-select"] .Select-control').click();
        // Finding column to select
        cy.get('[role="option"]')
          .contains(COLUMNS.TEXT_1)
          .click();

        // open size menu
        cy.get('[data-test-id="size-select"] .Select-control').click();
        // Finding column to select
        cy.get('[role="option"]')
          .contains(COLUMNS.NUMBER_3)
          .click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.Chart circle').should('exist');
      })

      .then(() => {
        // Bar
        cy.get('[data-test-id="visualisation-type-bar"]', { timeout: 20000 }).click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.Chart rect').should('exist');
      })

      .then(() => {
        // Bubble
        cy.get('[data-test-id="visualisation-type-bubble"]', { timeout: 20000 }).click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.Chart circle').should('exist');
      })

      .then(() => {
        // Pie
        cy.get('[data-test-id="visualisation-type-pie"]', { timeout: 20000 }).click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.Chart path').should('exist');
      })

      .then(() => {
        // Donut
        cy.get('[data-test-id="visualisation-type-donut"]', { timeout: 20000 }).click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.Chart path').should('exist');
      })

      .then(() => {
        // Pivot
        cy.get('[data-test-id="visualisation-type-pivot-table"]', { timeout: 20000 }).click();

        // wait for changes to be saved
        cy.get('.saveStatus').should('contain', 'All changes saved');
        // chart elements exist
        cy.get('.PivotTable th').contains('Bob').should('exist');
        cy.get('.PivotTable th').contains('Jane').should('exist');
        cy.get('.PivotTable th').contains('Frank').should('exist');
        cy.get('.PivotTable th').contains('Lisa').should('exist');
        cy.get('.PivotTable td').contains('Total').should('exist');
        cy.get('.PivotTable td.cell').contains('1').should('exist');
        cy.get('.PivotTable .categoryColumnTitle').contains(COLUMNS.TEXT_1).should('exist');
      })

      .then(() => {
        // back to library
        cy.get('[data-test-id="back-button"]').click();
      });
  });
});

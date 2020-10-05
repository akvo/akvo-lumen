// DATASET INFORMATION
const DATASET_LINK =
  'https://raw.githubusercontent.com/akvo/akvo-lumen/master/client/e2e-test/sample-data-1.csv';
const datasetName = `Dataset ${Date.now().toString()}`;
const COLUMNS = {
  TEXT_1: 'Name',
  CAT_1: 'Cat',
  NUMBER_1: 'Age',
  NUMBER_2: 'Humidity',
  NUMBER_3: 'Score',
  NUMBER_4: 'Temperature',
};

describe('Akvo Lumen e2e tests', () => {
  beforeEach(() => {
    cy.login();
  });

  it('runs all tests', () => {
    context('create dataset: link', () => {
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
      cy.get(`[data-test-name="${datasetName}"]:not(.PENDING)`).should('exist');
      cy.get(`[data-test-name="${datasetName}"] > a`).click({ force: true });

      // see if table cells exist
      cy.get('.fixedDataTableCellLayout_main').should(
        'have.length.of.at.least',
        4
      );

      // back to library
      cy.get('[data-test-id="back-button"]').click();
    });

    context('create visualisation (pivot table)', () => {
      cy.get('button[data-test-id="visualisation"]').click();
      cy.get('[data-test-id="visualisation-type-pivot-table"]').click({
        force: true,
      });

      cy.get('[data-test-id="dataset-menu"] .SelectMenu input')
        .first()
        .click({ force: true })
        .type(`${datasetName}{enter}`, { force: true });

      // open column menu
      cy.get('[data-test-id="column-select"] .SelectMenu input', {
        timeout: 10000,
      })
        .first()
        .click({ force: true })
        .type(`${COLUMNS.TEXT_1}{enter}`, { force: true });

      const title = `Visualisation of ${datasetName}`;

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
      cy.get('.PivotTable .categoryColumnTitle')
        .contains(COLUMNS.TEXT_1)
        .should('exist');

      // back to library
      cy.get('[data-test-id="back-button"]').click();
    });

    context('create visualisation from dataset page', () => {
      cy.get('.dataset').contains(datasetName).click({ force: true });
      cy.get('button[data-test-id="visualise"]').click({ force: true });
      cy.get('[data-test-id="visualisation-type-pivot-table"]').click({
        force: true,
      });

      cy.get('[data-test-id="dataset-menu"] .SelectMenu input')
        .first()
        .click({ force: true })
        .type(`${datasetName}{enter}`, { force: true });

      cy.get('[data-test-id="column-select"] .SelectMenu input')
        .first()
        .click({ force: true })
        .type(`${COLUMNS.TEXT_1}{enter}`, { force: true });

      const title = `Visualisation of ${datasetName} 2`;
      // Selecting column
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
      cy.get('.PivotTable .categoryColumnTitle')
        .contains(COLUMNS.TEXT_1)
        .should('exist');

      // back to library
      cy.get('[data-test-id="back-button"]').click();
    });

    context('create dashboard', () => {
      cy.get('button[data-test-id="dashboard"]').click({ force: true });

      // Selecting visualisation
      cy.get(`[data-test-name="Visualisation of ${datasetName}"]`).click();

      // Typing dashboard name
      cy.get('div[data-test-id="entity-title"]').click();
      cy.get('input[data-test-id="entity-title"]').type(
        `Dashboard of ${datasetName}`
      );

      // Saving dashboard
      cy.get('body').click();

      // visualization has been added
      cy.get('[data-test-id="dashboard-canvas-item"] h2').contains(
        `Visualisation of ${datasetName}`
      );

      cy.get('[data-test-id="dashboard-canvas-item"] .PivotTable').should(
        'exist'
      );

      // back to library
      cy.get('[data-test-id="back-button"]').click();
    });

    context('change visualization types', () => {
      cy.get('button[data-test-id="visualisation"]').click();

      // Area
      cy.get('[data-test-id="visualisation-type-area"]').click({ force: true });
      cy.get('[data-test-id="dataset-menu"] .SelectMenu input')
        .first()
        .click({ force: true })
        .type(`${datasetName}{enter}`, { force: true });

      // open x axis menu
      cy.get('[data-test-id="x-axis-select"] .SelectMenu input')
        .eq(2)
        .click({ force: true })
        .type(`${COLUMNS.NUMBER_1}{enter}`, { force: true });

      cy.get('[data-test-id="y-axis-select"] .SelectMenu input')
        .eq(0)
        .click({ force: true })
        .type(`${COLUMNS.NUMBER_2}{enter}`, { force: true });

      // wait for changes to be saved
      cy.get('.saveStatus').should('contain', 'All changes saved');

      // chart elements exist
      cy.get('.Chart .vx-line').should('exist');

      // Line
      cy.get('[data-test-id="visualisation-type-line"]').click({ force: true });
      cy.get('.saveStatus').should('contain', 'All changes saved');
      cy.get('.Chart .vx-line').should('exist');

      // Scatter
      cy.get('[data-test-id="visualisation-type-scatter"]').click({ force: true });
      cy.get('.Chart circle').should('exist');

      // open bucket menu
      cy.get('[data-test-id="category-select"] .SelectMenu input')
        .eq(0)
        .click({ force: true })
        .type(`${COLUMNS.TEXT_1}{enter}`, { force: true });

      // open size menu
      cy.get('[data-test-id="size-select"] .SelectMenu input')
        .eq(0)
        .click({ force: true })
        .type(`${COLUMNS.NUMBER_3}{enter}`, { force: true });

      // wait for changes to be saved
      cy.get('.saveStatus').should('contain', 'All changes saved');
      cy.get('.Chart circle').should('exist');

      // Bar
      cy.get('[data-test-id="visualisation-type-bar"]').click({ force: true });
      cy.get('.saveStatus').should('contain', 'All changes saved');
      cy.get('.Chart rect').should('exist');

      // Bubble
      cy.get('[data-test-id="visualisation-type-bubble"]').click({ force: true });
      cy.get('.saveStatus').should('contain', 'All changes saved');
      cy.get('.Chart circle').should('exist');

      // Pie
      cy.get('[data-test-id="visualisation-type-pie"]').click({ force: true });
      cy.get('.saveStatus').should('contain', 'All changes saved');
      cy.get('.Chart path').should('exist');

      // Donut
      cy.get('[data-test-id="visualisation-type-donut"]').click({ force: true });
      cy.get('.saveStatus').should('contain', 'All changes saved');
      cy.get('.Chart path').should('exist');

      // Pivot
      cy.get('[data-test-id="visualisation-type-pivot-table"]').click({ force: true });
      cy.get('.saveStatus').should('contain', 'All changes saved');

      // chart elements exist
      cy.get('.PivotTable th')
        .contains('Bob')
        .should('exist');
      cy.get('.PivotTable th')
        .contains('Jane')
        .should('exist');
      cy.get('.PivotTable th')
        .contains('Frank')
        .should('exist');
      cy.get('.PivotTable th')
        .contains('Lisa')
        .should('exist');
      cy.get('.PivotTable td')
        .contains('Total')
        .should('exist');
      cy.get('.PivotTable td.cell')
        .contains('1')
        .should('exist');
      cy.get('.PivotTable .categoryColumnTitle')
        .contains(COLUMNS.TEXT_1)
        .should('exist');
    });
  });

  afterEach(() => {
    // back to library
    cy.get('[data-test-id="back-button"]').click();

    // delete dataset and visualization
    cy.get(`[data-test-name="${datasetName}"] [data-test-id="show-controls"]`, { timeout: 10000 }).click({ force: true });
    cy.get(`[data-test-name="${datasetName}"] [data-test-id="delete"]`).click({ force: true });

    cy.get('.DeleteConfirmationModal button.delete').click();
    cy.get(`.LibraryListingItem [title="${datasetName}"]`).should('not.to.exist');

    // delete dashboard
    cy.get(`[data-test-name="Dashboard of ${datasetName}"] [data-test-id="show-controls"]`)
      .click({ force: true });

    cy.get(`[data-test-name="Dashboard of ${datasetName}"] [data-test-id="delete"]`)
      .click({ force: true });

    cy.get('.DeleteConfirmationModal button.delete').click();
  });
});

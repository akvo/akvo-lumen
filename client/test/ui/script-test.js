/* *
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http:// www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global testDatasetName testDatasetId */

const puppeteer = require('puppeteer');

const name = new Date().getTime().toString();

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  // page.on('console', msg => console.log(msg));
  await page.goto('http://t1.lumen.localhost:3030/', { waitUntil: 'networkidle' });
  // Login
  await page.focus('#username');
  await page.type('jerome');
  await page.focus('#password');
  await page.type('password');
  await page.click('#kc-login');
  await page.waitForSelector('button[data-test-id="dataset"]');
  await page.evaluate(`const testDatasetName = "${name}";`);
  // Dataset adding
  // Click Dataset+ option
  await page.click('button[data-test-id="dataset"]');
  await page.waitForSelector('footer button');
  // Select link option
  await page.click('input[data-test-id="source-option"][value="LINK"]');
  await page.click('footer button:nth-of-type(2)');
  await page.waitForSelector('#linkFileInput');
  // Insert link
  await page.focus('#linkFileInput');
  await page.type('https://github.com/lawlesst/vivo-sample-data/raw/master/data/csv/people.csv');
  await page.click('footer button:nth-of-type(2)');
  await page.waitForSelector('input[data-test-id="dataset-name"]');
  // Insert name
  await page.focus('input[data-test-id="dataset-name"]');
  await page.type(name);
  // Import
  await page.click('footer button:nth-of-type(2)');
  await page.waitForNavigation({ timeout: 10000, waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const dsElement = document.querySelector(`li[data-test-name="${testDatasetName}"]`);
    window.testDatasetId = dsElement.getAttribute('data-test-id');
  });
  // Visualisation
  await page.click('button[data-test-id="visualisation"]');

  await page.waitForSelector('li[data-test-id="button-pivot-table"]');
  await page.click('li[data-test-id="button-pivot-table"]');

  await page.waitForSelector('label[data-test-id="dataset-menu"]+div');
  await page.click('label[data-test-id="dataset-menu"]+div');
  await page.waitForSelector('div[data-test-id="input-group"]>div>div>div:nth-of-type(2)');
  await page.click('div[data-test-id="input-group"]>div>div>div:nth-of-type(2)');
  // await page.screenshot({ path: 'a.png', fullPage: true });
  await page.$eval('input[name="xDatasetMenu"]', (el) => { el.setAttribute('value', testDatasetId); });
  await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div');
  // await page.screenshot({ path: 'b.png', fullPage: true });
  await page.click('label[data-test-id="categoryColumnInput"]+div');
  await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div>div>div:nth-of-type(2)');
  await page.click('label[data-test-id="categoryColumnInput"]+div>div>div:nth-of-type(2)');
  // await page.screenshot({ path: 'b.png', fullPage: true });
  await page.waitForSelector('input[name="categoryColumnInput"]');
  await page.$eval('input[name="categoryColumnInput"]', (el) => { el.setAttribute('value', 'c9'); });
  await page.click('div[data-test-id="entity-title"]');
  await page.focus('input[data-test-id="entity-title"]');
  await page.type('Visualizacion de '.concat(name));
  await page.click('button[data-test-id="save-changes"]');
  await page.click('i[data-test-id="fa-arrow"]');

  // Dashboard
  await page.waitForSelector('button[data-test-id="dashboard"]');
  await page.click('button[data-test-id="dashboard"]');
  await page.waitForSelector('li[class^="listItem"]');
  await page.click('li[class^="listItem"]');
  await page.waitForSelector('div[data-test-id="dashboard-canvas-item"]');
  // await page.screenshot({ path: 'after.png', fullPage: true });
  await page.click('div[data-test-id="entity-title"]');
  await page.focus('input[data-test-id="entity-title"]');
  await page.type('Dashboard de '.concat(name));
  await page.click('button[data-test-id="save-changes"]');
  // await page.screenshot({ path: 'list.png', fullPage: true });
  await page.click('i[data-test-id="fa-arrow"]');
  await page.waitForSelector('div[data-test-id="library"]');
  // Delete
  /* await page.click('li[data-test-id="'+id+'"] button[data-test-id="show-controls"]');
  await page.waitForSelector('button[data-test-id="delete-dataset"]');
  await page.click('button[data-test-id="delete-dataset"]');
  await page.waitForSelector('button[data-test-id="delete-footer"]');
  await page.click('button[data-test-id="delete-footer"]');*/
  await browser.close();
})();

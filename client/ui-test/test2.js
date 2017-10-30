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
  const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
  const page = await browser.newPage();
  // page.on('console', msg => console.log(msg));
  await page.goto('http://t1.lumen.local:3030/');
  //await page.goto('http://auth.lumen.local:8080/auth/realms/akvo', { waitUntil: 'networkidle' });
  await page.screenshot({path: "login.png",  fullPage: true})
  //await page.waitForSelector('#username');

 /* await page.click('i[data-test-id="fa-arrow"]');

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

/**
 * Copyright 2017 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global __datasetName */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-unresolved */
/* eslint-disable no-console */

const puppeteer = require('puppeteer');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const datasetName = Date.now().toString();
const TIMEOUT = {
  waitFor: 10 * 1000,
  datasetImport: 15 * 1000,
  datasetPending: 2 * 1000,
};
const lumenUrl = process.env.LUMEN_URL;
const username = process.env.LUMEN_USER;
const password = process.env.LUMEN_PASSWORD;

async function login(page) {
  await page.waitForSelector('#username', { timeout: TIMEOUT.waitFor });
  console.log('Typing username...');
  await page.type('#username', username);
  console.log('Typing password...');
  await page.type('#password', password);
  console.log('Trying login...');
  await page.click('#kc-login');
}

async function goto(page, url) {
  await page.goto(url);
  await page.addScriptTag({
    url: 'https://cdn.jsdelivr.net/npm/sourcemapped-stacktrace@1.1.8/dist/sourcemapped-stacktrace.js',
  });
}

async function test(page, shouldLogin) {
  console.log('\nSTARTING LUMEN TEST WITH PUPPETEER\n');
  await page.setViewport({ width: 1024, height: 768 });
  console.log(`Accessing to ${lumenUrl}...`);
  await goto(page, lumenUrl);
  if (shouldLogin) {
    await login(page);
  }
  await page.waitForSelector('button[data-test-id="dataset"]', { timeout: TIMEOUT.waitFor });
  await page.addScriptTag({
    url: 'https://raw.githubusercontent.com/novocaine/sourcemapped-stacktrace/master/sourcemapped-stacktrace.js',
  });

  console.log('Login was successful.\n');
  await page.evaluate(`window.__datasetName = "${datasetName}"`);

  // Dataset adding
  // Click Dataset+ option
  console.log('Accessing to dataset creation...');
  await page.click('button[data-test-id="dataset"]');
  await page.waitForSelector('button[data-test-id="next"]', { timeout: TIMEOUT.waitFor });
  // Select link option
  console.log('Typing dataset link...');
  await page.click('input[data-test-id="source-option"][value="LINK"]');
  await page.click('button[data-test-id="next"]');
  await page.waitForSelector('#linkFileInput', { timeout: TIMEOUT.waitFor });
  // Insert link
  await page.type('#linkFileInput', 'https://github.com/lawlesst/vivo-sample-data/raw/master/data/csv/people.csv');
  await page.click('button[data-test-id="next"]');
  await page.waitForSelector('input[data-test-id="dataset-name"]', { timeout: TIMEOUT.waitFor });
  // Insert name
  console.log('Typing dataset name...');
  await page.type('input[data-test-id="dataset-name"]', datasetName);
  // Import
  console.log('Saving dataset...');
  await page.click('button[data-test-id="next"]');
  console.log(`Dataset ${datasetName} was successfully created.\n`);
  await page.waitForSelector(`[data-test-name="${datasetName}"]`);

  // Search of the ID
  console.log('Extracting dataset ID...');
  const id = await page.evaluate(() => {
    const found = document.querySelector(`[data-test-name="${__datasetName}"]`);
    return Promise.resolve(found.getAttribute('data-test-id'));
  });
  console.log(`ID extracted: ${id}\n`);
  let pending;
  const timeOut = setTimeout(() => { console.log('Error waiting for dataset import'); process.exit(1); }, TIMEOUT.datasetImport);
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  do {
    console.log('Waiting for dataset import...');
    await sleep(TIMEOUT.datasetPending);
    pending = await page.$(`[data-test-name="${datasetName}"] [data-test-id="pending"]`);
  } while (pending);
  clearTimeout(timeOut);
  // Visualisation
  console.log('Accessing to visualisation creation...');
  await page.click('button[data-test-id="visualisation"]');
  console.log('Selecting pivot table option...');
  await page.waitForSelector('li[data-test-id="button-pivot-table"]', { timeout: TIMEOUT.waitFor });
  await page.click('li[data-test-id="button-pivot-table"]');
  console.log('Selecting dataset...');
  await page.waitForSelector('[data-test-id="select-menu"]', { timeout: TIMEOUT.waitFor });
  await page.click('[data-test-id="select-menu"]');
  const optionId = await page.evaluate(() => {
    const elements = document.querySelectorAll('[role="option"]');
    const options = Array.from(elements);
    const found = options.find(e => e.textContent === __datasetName);
    return Promise.resolve(found.getAttribute('id'));
  });
  await page.click(`#${optionId}`);
  await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div', { timeout: TIMEOUT.waitFor });
  await page.click('label[data-test-id="categoryColumnInput"]+div');
  console.log('Selecting columns...');
  const columnId = await page.evaluate(() => {
    const elements = document.querySelectorAll('[role="option"]');
    const options = Array.from(elements);
    const found = options.find(e => e.textContent === 'title (text)');
    return Promise.resolve(found.getAttribute('id'));
  });
  await page.click(`#${columnId}`);
  await page.click('div[data-test-id="entity-title"]');
  console.log('Typing visualisation name...');
  await page.type('input[data-test-id="entity-title"]', `Visualisation of ${datasetName}`);
  console.log('Saving visualisation...');
  await page.click('button[data-test-id="save-changes"]');
  console.log(`Visualisation ${datasetName} was successfully created.\n`);

  console.log('Back to library');
  await goto(page, lumenUrl);
//   Dashboard
  await page.waitForSelector('[data-test-id="dashboard"]', { timeout: TIMEOUT.waitFor });
  console.log('Accessing to dashboard creation...');
  await page.click('[data-test-id="dashboard"]');
  console.log('Selecting visualisation...');
  await page.waitForSelector(`[data-test-name="Visualisation of ${datasetName}"]`, { timeout: TIMEOUT.waitFor });
  await page.click(`[data-test-name="Visualisation of ${datasetName}"]`);
  console.log('Waiting for visualisation to be added...');
  await page.waitForSelector('div[data-test-id="dashboard-canvas-item"]', { timeout: TIMEOUT.waitFor });
  console.log('Typing dashboard name...');
  await page.click('div[data-test-id="entity-title"]');
  await page.type('input[data-test-id="entity-title"]', `Dashboard of ${datasetName}`);
  console.log('Saving dashboard...');
  await page.click('button[data-test-id="save-changes"]');
  await page.click('[data-test-id="back-button"]');
  console.log(`Dashboard ${datasetName} was successfully created.\n`);
}


let browser;
let page;

const pagePromise =
  puppeteer.launch({
//   headless: false,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ] }).then((b) => {
      browser = b;
      return browser.newPage();
    })
    .then((p) => {
      page = p;
    });

const logStackTrace = async (error) => {
  page.evaluate(stack => new Promise(resolve =>
    window.sourceMappedStackTrace.mapStackTrace(stack, (newStack) => {
      resolve(newStack);
    })
  ), typeof error.stack === 'string' ? error.stack : error.stack.join('\n')).then((result) => {
    console.log('ERROR:', error.message, result);
  });
};

async function runTest() {
  page.on('load', () => console.log('PAGE LOADED'));
  page.on('domcontentloaded', () => console.log('DOM CONTENT LOADED'));
  page.on('console', msg => console.log('PAGE LOG:', msg.text));
  page.on('pageerror', logStackTrace);
  page.on('error', logStackTrace);
  page.on('requestfailed', (request) => {
    console.log(`REQUEST FAILED: ${request.method} ${request.url}`);
  });

  await page.tracing.start({ screenshots: true, path: 'trace.json' });
  try {
    await test(page, true);
  } catch (err) {
    await page.tracing.stop();
    console.log(`THE TEST FAILED\n${err}`);
    try {
      console.log('Uploading debug file to transfer.sh');
      const { stdout } = await exec(`curl --upload-file trace.json 'https://transfer.sh/${datasetName}.json'`);
      console.log('Debug file can be found at:');
      console.log(stdout);
      console.log('Open it in the Chrome Dev Tools, in the performance panel');
    } catch (err2) {
      console.log(err2);
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
}

pagePromise.then(runTest);

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

'use strict';

const puppeteer = require('puppeteer');
const name = 'puppeteer test';
(async() => {
	const browser = await puppeteer.launch({
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
	const page = await browser.newPage();
	var id;
	//Login
	try{
		await console.log("\nSTARTING LUMEN TEST WITH PUPPETEER\n");
		await page.setViewport({width: 1024, height: 768});
		await console.log("Accessing to http://t1.lumen.local:3030...");
		await page.goto('http://t1.lumen.local:3030/');
		await page.waitForSelector('#username', {timeout:10000});
		await console.log("Typing username...");
		await page.type('#username','jerome');
		await console.log("Typing password...");
		await page.type('#password','password');
		await console.log("Trying login...");
		await page.click('#kc-login');
		await page.waitForSelector('button[data-test-id="dataset"]', {timeout:10000});
		//Dataset adding
		//Click Dataset+ option
		await console.log("Accessing to dataset creation...");
		await page.click('button[data-test-id="dataset"]');
		await page.waitForSelector('button[data-test-id="next"]', {timeout:10000});
		//Select link option
		await console.log("Typing dataset link...");
		await page.click('input[data-test-id="source-option"][value="LINK"]');
		await page.click('button[data-test-id="next"]');
		await page.waitForSelector('#linkFileInput', {timeout:10000});
		//Insert link
		await page.type('#linkFileInput','https://github.com/lawlesst/vivo-sample-data/raw/master/data/csv/people.csv');
		await page.click('button[data-test-id="next"]');
		await page.waitForSelector('input[data-test-id="dataset-name"]', {timeout:10000});
		//Insert name
		await console.log("Typing dataset name...");
		await page.type('input[data-test-id="dataset-name"]', 'Dataset '+name);
		//Import
		await console.log("Saving dataset...");
		await page.click('button[data-test-id="next"]');
		await console.log("Dataset "+name+" was successfully created.\n");
		await page.waitForNavigation({timeout:5000, waitUntil: 'networkidle'});
		//Search of the ID
		await console.log("Extracting dataset ID...");
		id = await page.evaluate(() => {
			var tags = Array.from(document.getElementsByTagName("h3"));
			for (var i = 0; i < tags.length; i++) {
			  if (tags[i].textContent == 'Dataset puppeteer test') {
				var found = tags[i];
				break;
			  }
			}
			return found.parentElement.parentElement.parentElement.getAttribute('data-test-id');
		});
		await console.log("ID extracted: "+id+"\n");

		//Visualisation
		await console.log("Accessing to visualisation creation...");
		await page.click('button[data-test-id="visualisation"]');
		await console.log("Selecting pivot table option...");
		await page.waitForSelector('li[data-test-id="button-pivot-table"]', {timeout:10000});
		await page.click('li[data-test-id="button-pivot-table"]');
		await console.log("Selecting dataset...");
		await page.waitForSelector('label[data-test-id="dataset-menu"]+div', {timeout:10000});
		await page.click('label[data-test-id="dataset-menu"]+div');
		await page.waitForSelector('div[data-test-id="input-group"]>div>div>div:nth-of-type(2)', {timeout:10000});
		await page.click('div[data-test-id="input-group"]>div>div>div:nth-of-type(2)');
		await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div', {timeout:10000});
		await page.click('label[data-test-id="categoryColumnInput"]+div');
		await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div>div>div:nth-of-type(2)', {timeout:10000});
		await page.click('label[data-test-id="categoryColumnInput"]+div>div>div:nth-of-type(2)');
		await page.waitForSelector('input[name="categoryColumnInput"]', {timeout:10000});
		await console.log("Selecting columns...");
		await page.$eval('input[name="categoryColumnInput"]', el => el.value='c9');
		await page.click('div[data-test-id="entity-title"]');
		await console.log("Typing visualisation name...");
		await page.type('input[data-test-id="entity-title"]', 'Visualisation of '+name);
		await console.log("Saving visualisation...");
		await page.click('button[data-test-id="save-changes"]');
		await page.goto('http://t1.lumen.local:3030/library');
		await page.waitForSelector('button[data-test-id="dashboard"]', {timeout:10000});
		await console.log("Visualisation "+name+" was successfully created.\n");
		//Dashboard
		await console.log("Accessing to dashboard creation...");
		await page.click('button[data-test-id="dashboard"]');
		await console.log("Selecting visualisation...");
		await page.waitForSelector('li[class^="listItem"]', {timeout:10000});
		await page.click('li[class^="listItem"]');
		await console.log("Typing dashboard name...");
		await page.waitForSelector('div[data-test-id="dashboard-canvas-item"]', {timeout:10000});
		await page.click('div[data-test-id="entity-title"]');
		await page.type('input[data-test-id="entity-title"]', 'Dashboard of '+name);
		await console.log("Saving dashboard...");
		await page.click('button[data-test-id="save-changes"]');
		await page.click('i[data-test-id="fa-arrow"]');
		await console.log("Dashboard "+name+" was successfully created.\n");
		await console.log("THE TEST WAS SUCCESSFUL");
		
	}catch(err){
		await console.log("THE TEST FAILED\n"+err);
		process.exit(1);
	} finally{
		await browser.close();
	}

})();

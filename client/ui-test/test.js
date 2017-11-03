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
/* Si se cambia la variable name, también hay que cambiar el nombre en la
   búsqueda del ID  */
const name = 'AJI';
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
		await page.setViewport({width: 1024, height: 768});
		await console.log("Accessing to http://t1.lumen.local:3030...\n");
		await page.goto('http://t1.lumen.local:3030/');
		await page.waitForSelector('#username', {timeout:5000});
		await console.log("Typing username...\n");
		await page.type('#username','jerome');
		await console.log("Typing password...\n");
		await page.type('#password','password');
		await console.log("Trying login...\n");
		await page.click('#kc-login');
		await page.waitForSelector('button[data-test-id="dataset"]', {timeout:5000});
		
		//Dataset adding
		//Click Dataset+ option
		await console.log("Accessing to dataset creation...\n");
		await page.click('button[data-test-id="dataset"]');
		
		await page.waitForSelector('button[data-test-id="btn next clickable positive-footer"]', {timeout:5000});
		//Select link option
		await console.log("Typing dataset link...\n");
		await page.click('input[data-test-id="source-option"][value="LINK"]');
		await page.click('button[data-test-id="btn next clickable positive-footer"]');
		await page.waitForSelector('#linkFileInput', {timeout:5000});
		//Insert link
		await page.type('#linkFileInput','https://github.com/lawlesst/vivo-sample-data/raw/master/data/csv/people.csv');
		await page.click('button[data-test-id="btn next clickable positive-footer"]');
		await page.waitForSelector('input[data-test-id="dataset-name"]', {timeout:5000});
		//Insert name
		await console.log("Typing dataset name...\n");
		await page.type('input[data-test-id="dataset-name"]', 'Dataset '+name);
		//Import
		await console.log("Saving dataset...\n");
		await page.click('button[data-test-id="btn next clickable positive-footer"]');


		await page.waitForNavigation({timeout:5000, waitUntil: 'networkidle'});
		
		//BÚSQUEDA DEL ID
		await console.log("Extracting dataset ID...\n");
		id = await page.evaluate(() => {
			var tags = Array.from(document.getElementsByTagName("h3"));
			for (var i = 0; i < tags.length; i++) {
			  if (tags[i].textContent == 'Dataset AJI') {
				var found = tags[i];
				break;
			  }
			}
			return found.parentElement.parentElement.parentElement.getAttribute('data-test-id');
		});
		await console.log(id);

		//Visualisation
		await page.click('button[data-test-id="visualisation"]');

		await page.waitForSelector('li[data-test-id="button-pivot-table"]', {timeout:5000});
		await page.click('li[data-test-id="button-pivot-table"]');

		await page.waitForSelector('label[data-test-id="dataset-menu"]+div', {timeout:5000});
		await page.click('label[data-test-id="dataset-menu"]+div');
		await page.waitForSelector('div[data-test-id="input-group"]>div>div>div:nth-of-type(2)', {timeout:5000});
		await page.click('div[data-test-id="input-group"]>div>div>div:nth-of-type(2)');
		
		await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div', {timeout:5000});
		await page.click('label[data-test-id="categoryColumnInput"]+div');
		await page.waitForSelector('label[data-test-id="categoryColumnInput"]+div>div>div:nth-of-type(2)', {timeout:5000});
		await page.click('label[data-test-id="categoryColumnInput"]+div>div>div:nth-of-type(2)');
		await page.waitForSelector('input[name="categoryColumnInput"]', {timeout:5000});
		await page.$eval('input[name="categoryColumnInput"]', el => el.value='c9');
		await page.click('div[data-test-id="entity-title"]');
		await page.type('input[data-test-id="entity-title"]', 'Visualizacion de '+name);
		await page.click('button[data-test-id="save-changes"]');
		await page.screenshot({path: 'VIS.png', fullPage: true});
		await page.click('i[data-test-id="fa-arrow"]');
		//Dashboard
		
		await page.waitForSelector('button[data-test-id="dashboard"]', {timeout:5000});
		await page.click('button[data-test-id="dashboard"]');
		await page.waitForSelector('li[class^="listItem"]', {timeout:5000});
		await page.click('li[class^="listItem"]');
		await page.waitForSelector('div[data-test-id="dashboard-canvas-item"]', {timeout:5000});
		await page.screenshot({path: 'after.png', fullPage: true});
		await page.click('div[data-test-id="entity-title"]');
		await page.type('input[data-test-id="entity-title"]', 'Dashboard de '+name);
		await page.click('button[data-test-id="save-changes"]');
		await page.screenshot({path: 'list.png', fullPage: true});
		await page.click('i[data-test-id="fa-arrow"]');
		await page.waitForSelector('div[data-test-id="library"]', {timeout:5000});
		//Delete
		/*await page.click('li[data-test-id="'+id+'"] button[data-test-id="show-controls"]');
		await page.waitForSelector('button[data-test-id="delete-dataset"]', {timeout:5000});
		await page.click('button[data-test-id="delete-dataset"]');
		await page.waitForSelector('button[data-test-id="delete-footer"]', {timeout:5000});
		await page.click('button[data-test-id="delete-footer"]');*/
	}catch(err){
		console.log(err);
	} finally{
		await browser.close();
	}

})();

const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
let browser;

(async() => {
  browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  app.listen(3001);
})();

app.get('/pdf', async (req, res) => {
  if (!req.query) res.status(400).send('target query param required');
  const { target } = req.query;
  const page = await browser.newPage();

  await page.goto(target, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    // printBackground: true,
  });

  // send pdf to storage
  // res.send(url to stored pdf);
});

app.get('/png', async (req, res) => {
  if (!req.query) res.status(400).send('target query param required');
  const { target } = req.query;
  const page = await browser.newPage();

  await page.goto(target, { waitUntil: 'networkidle0' });
  const pngBuffer = await page.screenshot({
    format: 'A4',
    omitBackground: true,
    // clip: {
    //   x,
    //   y,
    //   width,
    //   height,
    // },
  });

  // send png to storage
  // res.send(url to stored png);
});

function exitHandler(options, err) {
  if (browser) browser.close();
  if (options.exit) process.exit(err ? err.code : 0);
}

process.on('exit', exitHandler); //do something when app is closing
process.on('SIGINT', exitHandler); //catches ctrl+c event
process.on('SIGUSR1', exitHandler); // catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler); //catches uncaught exceptions
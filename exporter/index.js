const express = require('express');
const puppeteer = require('puppeteer');
const validate = require('express-validation');
const Joi = require('joi');
const Raven = require('raven');
const bodyParser = require('body-parser')
const cors = require('cors')

const validation = {
  screenshot: {
    body: {
      format: Joi.string().valid(['png', 'pdf']),
      target: Joi.string().uri().required(),
      title: Joi.string(),
      selector: Joi.string().required(),
    },
  },
};

if (process.env.SENTRY_DSN) {
  Raven.config(process.env.SENTRY_DSN).install();
}

const captureException = error => {
  if (process.env.SENTRY_DSN) {
    Raven.captureException(error);
  } else {
    console.error(error);
  }
};

const setContext = (contextData, callback) => {
  if (process.env.SENTRY_DSN) {
    Raven.context(function () {
      Raven.setContext(contextData);
      callback();
    });
  } else {
    callback();
  }
};

const app = express();
let browser;
let context;

app.use(bodyParser.json());
app.use(cors());

(async() => {
  browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });
  // Create a new incognito browser context.
  context = await browser.createIncognitoBrowserContext();
  console.log('Exporter started...');
  app.listen(process.env.PORT || 3001, '0.0.0.0');
})();

app.post('/screenshot', validate(validation.screenshot), async (req, res) => {
  const {
    target,
    format,
    title,
    token,
    refreshToken,
    selector,
    clip,
  } = req.body;

  setContext({ target, format, title }, async () => {
    try {
      const page = await context.newPage();

      page.on('pageerror', captureException);
      page.on('error', (e) => captureException(e));

      const dest = `${target}?token=${token}&refresh_token=${refreshToken}`;

      await page.goto(dest, { waitUntil: 'networkidle2', timeout: 0 });

      const selectors = (selector || '').split(',');
      if (selectors.length) {
        selectors.forEach(async (selector) => {
          await page.waitFor(selector);
        });
      } else {
        await page.waitFor(5000);
      }

      let screenshot;
      switch (format) {
        case 'png': {
          screenshot = await page.screenshot({
            format: 'A4',
            omitBackground: false,
            clip,
            encoding: 'base64',
          });
          const data = screenshot;
          res.setHeader('Content-Length', data.length);
          res.setHeader('Content-Type', 'image/png');
          res.setHeader('Content-Disposition', `attachment; filename=${title}.png`);
          res.send(data);
          break;
        }
        case 'pdf': {
          screenshot = await page.pdf({
            format: 'A4',
            printBackground: true,
          });
          const data = screenshot.toString('base64');
          res.setHeader('Content-Length', data.length);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename=${title}.pdf`);
          res.send(data);
          break;
        } 
      }
      
      await page.close();
    } catch (err) {
      captureException(err);
      res.sendStatus(500);
    }
  });
});

function exitHandler(options, err) {
  if (browser) browser.close();
  if (err) captureException(err);
  if (options.exit) process.exit(err ? err.code : 0);
}

process.on('exit', exitHandler); //do something when app is closing
process.on('SIGINT', exitHandler); //catches ctrl+c event
process.on('SIGUSR1', exitHandler); // catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler); //catches uncaught exceptions
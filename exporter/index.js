const express = require('express');
const puppeteer = require('puppeteer'); // eslint-disable-line
const validate = require('express-validation');
const Joi = require('joi');
const bodyParser = require('body-parser');
const cors = require('cors');
const httpCommon = require('_http_common');
const _ = require('lodash');
const Sentry = require('@sentry/node');

const validation = {
  screenshot: {
    body: {
      format: Joi.string().valid(['png', 'pdf']),
      target: Joi.string()
        .uri()
        .required(),
      title: Joi.string(),
      selector: Joi.string().required(),
    },
  },
};

let sentryClient;
const sentryIsEnabled = () => sentryClient;

const enableSentry = process.env.SENTRY_DSN
  && process.env.SENTRY_RELEASE
  && process.env.SENTRY_ENVIRONMENT
  && process.env.SENTRY_SERVER_NAME;

if (enableSentry) {
  console.log('Init Sentry');
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    release: process.env.SENTRY_RELEASE,
    environment: process.env.SENTRY_ENVIRONMENT,
    serverName: process.env.SENTRY_SERVER_NAME,
  });
  sentryClient = Sentry.getCurrentHub().getClient();
} else {
  console.log('Skipping Sentry');
}

const captureException = (error, runId = '') => {
  console.error(`Exception captured for run ID: ${runId} -`, error);
  if (sentryIsEnabled()) Sentry.captureException(error);
};

const configureScope = (contextData, callback) => {
  if (sentryIsEnabled()) {
    Sentry.configureScope((scope) => {
      _.map(contextData, (value, key) => {
        scope.setExtra(key, value);
      });
      callback();
    });
  } else {
    callback();
  }
};

const app = express();
let browser;
let currentJobCount = 0;
const MAX_CONCURRENT_JOBS = 5;

app.use(bodyParser.json());
app.use(cors());

(async () => {
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--dumpio'],
    });
    console.log('Exporter started...');
    app.listen(process.env.PORT || 3001, '0.0.0.0');
  } catch (err) {
    captureException(err);
  }
})();

function adaptTitle(title) {
  let r = '';
  [...title].forEach((c) => {
    r += (httpCommon._checkInvalidHeaderChar(c) ? '' : c); // eslint-disable-line
  });
  return r;
}


function addListeners(page, reject){
  page.on('pageerror', reject);
  page.on('error', reject);
  page.on('close', p => console.log('onpageevent close'));
  page.on('console', p => console.log('onpageevent console', msg => {
  for (let i = 0; i < msg.args().length; ++i)
    console.log(`${i}: ${msg.args()[i]}`);
}));
  page.on('dialog', d => console.log('onpageevent dialog', d.message()));
  page.on('domcontentloaded', e => console.log('onpageevent domcontentloaded', 'DOM fully loaded and parsed', e));
  page.on('error', e => console.log('onpageevent error', e.message));
  
  page.on('frameattached', f => console.log('onpageevent frameattached', f.name()));
  page.on('framedetached', f => console.log('onpageevent framedetached', f.name()));
  page.on('framenavigated', f => console.log('onpageevent framenavigated', f.name()));
  
  page.on('load', e => console.log('onpageevent load page is fully loaded'));

  page.on('metrics', p => console.log('onpageevent metrics', p.title));

  page.on('pageerror', e => console.log('onpageevent pageerror', e.message));
  
  page.on('popup', p => console.log('onpageevent popup', p.url()));

  page.on('request', r => console.log('onpageevent request', r.url()));
  page.on('requestfailed', r => console.log('onpageevent requestfailed', r.failure()));
  page.on('requestfinished', r => console.log('onpageevent requestfinished', r.url()));

  page.on('response', r => console.log('onpageevent response', r.url()));

  page.on('workercreated', w => console.log('onpageevent workercreated', w.url()));
  page.on('workerdestroyed', w => console.log('onpageevent workerdestroyed', w.url()));

}

const takeScreenshot = (req, runId) => new Promise((resolve, reject) => {
  const {
    target, format, title, selector, clip, filter,
  } = req.body;
  console.log('Starting run: ', runId, ' - ', target);
  console.log('Filter: ', filter);

    configureScope({ target, format, title, filter }, async () => {
      // Create a new incognito browser context.
      const context = await browser.createIncognitoBrowserContext();
      context.on('targetchanged', t => console.log(t.url()));
      context.on('targetcreated', t => console.log(t.url()));
      context.on('targetdestroyed', t => console.log(t.url()));


      
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(100000);
      addListeners(page, reject);

    const token = req.header('access_token');
    const locale = req.header('locale');
    const dest = `${target}?access_token=${token}&locale=${locale}&edit_user=false&query=${encodeURIComponent(JSON.stringify({filter}))}`;
    await page.goto(dest, { waitUntil: 'networkidle2', timeout: 0 });

    const selectors = (selector || '').split(',');
    if (selectors.length) {
      await Promise.all(selectors.map(async (s) => {
        try {
          await page.waitFor(s);
        } catch (error) {
          captureException(error);
          reject(error);
        }
      }));
    } else {
      await page.waitFor(5000);
    }

    await page.waitFor(2000);

    let screenshot;
    const screenshotOptions = {
      encoding: 'base64',
      format: 'A4',
      omitBackground: false,
    };

    switch (format) {
      case 'png': {
        if (clip === undefined) {
          screenshotOptions.fullPage = true;
        } else {
          screenshotOptions.clip = clip;
        }
        screenshot = await page.screenshot(screenshotOptions);
        resolve(screenshot);
        break;
      }
      case 'pdf': {
        screenshot = await page.pdf({
          format: 'A4',
          printBackground: true,
        });
        const data = screenshot.toString('base64');
        resolve(data);
        break;
      }
      // no default
    }

    await page.close();
    await context.close();
  });
});

const MAX_RETRIES = 2;

const sendScreenshotResponse = ({
  res, format, data, title,
}) => {
  switch (format) {
    case 'png': {
      res.setHeader('Content-Length', data.length);
      res.setHeader('Content-Type', 'image/png');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${adaptTitle(title)}.png`
      );
      res.send(data);
      break;
    }
    case 'pdf': {
      res.setHeader('Content-Length', data.length);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${adaptTitle(title)}.pdf`
      );
      res.send(data);
      break;
    }
    // no default
  }
};

app.post('/screenshot', validate(validation.screenshot), async (req, res) => {
  if (currentJobCount > MAX_CONCURRENT_JOBS) {
    res.sendStatus(503);
    return;
  }
  const runId = _.uniqueId();
  currentJobCount += 1;
  const { format, title } = req.body;
  let retryCount = 0;

  const tryTakeScreenshot = async () => {
    let data;
    try {
      data = await takeScreenshot(req, runId);
    } catch (error) {
      if (retryCount < MAX_RETRIES) {
        console.log(error);
        console.log('Duplicating/retrying run: ', runId);
        retryCount += 1;
        tryTakeScreenshot();
        return;
      }
      console.log('Run failed: ', error, runId);
      res.status(500).send(error);
      currentJobCount -= 1;
      return;
    }
    currentJobCount -= 1;
    sendScreenshotResponse({
      res, data, format, title,
    });
    console.log('Done run: ', runId);
  };
  tryTakeScreenshot();
});

function exitHandler(options, err) {
  if (browser) {
    browser.close();
  }
  if (err) {
    captureException(err);
  }
  if (options.exit) {
    process.exit(err ? err.code : 0);
  }
}

process.on('exit', exitHandler); // do something when app is closing
process.on('SIGINT', exitHandler); // catches ctrl+c event
process.on('SIGUSR1', exitHandler); // catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR2', exitHandler);
process.on('uncaughtException', exitHandler); // catches uncaught exceptions

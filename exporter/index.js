const express = require('express');
const puppeteer = require('puppeteer'); // eslint-disable-line
const validate = require('express-validation');
const Joi = require('joi');
const Raven = require('raven');
const bodyParser = require('body-parser');
const cors = require('cors');
const httpCommon = require('_http_common');
const _ = require('lodash');

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

if (process.env.SENTRY_DSN) {
  Raven.config(process.env.SENTRY_DSN).install();
}

const captureException = (error, runId = '') => {
  console.error(`Run ID: ${runId} -`, error);
  if (process.env.SENTRY_DSN) Raven.captureException(error);
};

const setContext = (contextData, callback) => {
  if (process.env.SENTRY_DSN) {
    Raven.context(() => {
      Raven.setContext(contextData);
      callback();
    });
  } else {
    callback();
  }
};

const app = express();
let browser;

app.use(bodyParser.json());
app.use(cors());

(async () => {
  try {
    browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
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

const takeScreenshot = (req, runId) => new Promise((resolve, reject) => {
  const {
    target, format, title, selector, clip,
  } = req.body;
  console.log('Starting run: ', runId, ' - ', target);
  setContext({ target, format, title }, async () => {
    try {
      // Create a new incognito browser context.
      const context = await browser.createIncognitoBrowserContext();
      const page = await context.newPage();
      page.setDefaultNavigationTimeout(100000);

      page.on('pageerror', e => captureException(e, runId));
      page.on('error', e => captureException(e, runId));

      const token = req.header('access_token');
      const locale = req.header('locale');
      const dest = `${target}?access_token=${token}&locale=${locale}`;
      await page.goto(dest, { waitUntil: 'networkidle2', timeout: 0 });

      const selectors = (selector || '').split(',');
      if (selectors.length) {
        await Promise.all(selectors.map(async (s) => {
          try {
            await page.waitFor(s);
          } catch (error) {
            captureException(error, runId);
          }
        }));
      } else {
        await page.waitFor(5000);
      }

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
    } catch (err) {
      captureException(err, runId);
      reject(err);
    }
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
  const runId = _.uniqueId();
  const { format, title } = req.body;
  let retryCount = 0;
  const tryTakeScreenshot = async () => {
    const data = await takeScreenshot(req, runId);
    sendScreenshotResponse({
      res, data, format, title,
    });
    console.log('Done run: ', runId);
  };
  try {
    tryTakeScreenshot();
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      console.log('Duplicating/retrying run: ', runId);
      retryCount += 1;
      tryTakeScreenshot();
      return;
    }
    res.status(500).send(error);
  }
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

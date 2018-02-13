import history from 'connect-history-api-fallback';
import proxy from 'http-proxy-middleware';
import express from 'express'; // eslint-disable-line
import path from 'path';
import { chalkProcessing, chalkSuccess } from './chalkConfig';

import proxyTargets from './proxyTargets';

const app = express();

console.log(chalkProcessing('Starting static test server...'));

app.use(
  history({
    rewrites: [
      { from: '^/favicon.ico$', to: 'favicon.ico' },
      { from: '^/s/.*$', to: '/index-pub.html' },
      // { from: '^.*$', to: '/index.html' },
    ],
  })
);

proxyTargets.forEach(({ source, ...rest }) => {
  app.use(proxy(source, {
    secure: false,
    ...rest,
  }));
});

app.use('/assets', express.static(path.resolve(__dirname, '../dist')));
app.use(express.static(path.resolve(__dirname, '../dist')));

const port = process.env.PORT || 3030;
app.listen(port, () => {
  console.log(chalkSuccess(`Static test server listening on: ${port}`));
});

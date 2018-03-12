/* eslint-disable */
var exec = require('child_process').exec;

exec('node -v', function (err, stdout) {
  console.log('Using NodeJS version: ', stdout);
  if (err) throw err;

  if (parseFloat(stdout.slice(1)) < 7.6) {
    throw new Error('requires node 4.0 or greater.');
  }
});

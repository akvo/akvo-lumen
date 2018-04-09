/* eslint-disable */

require('babel-register')();
require('ignore-styles');
const Enzyme = require('enzyme');
const Adapter = require('enzyme-adapter-react-16');

var jsdom = require('jsdom').jsdom;

Enzyme.configure({ adapter: new Adapter() });

var exposedProperties = ['window', 'navigator', 'document'];

global.document = jsdom('');
global.window = document.defaultView;
Object.keys(document.defaultView).forEach((property) => {
  if (typeof global[property] === 'undefined') {
    exposedProperties.push(property);
    global[property] = document.defaultView[property];
  }
});

global.navigator = {
  userAgent: 'node.js'
};

documentRef = document;

import React from 'react';
import { render } from 'react-dom';
import Root from './containers/Root';
import configureStore from './store/configureStore';

const initialState = {
  collections: [
    { name: 'Collection A', id: 123432 },
    { name: 'Collection B', id: 432111 },
    { name: 'Collection C', id: 332233 },
  ],
  user: {
    name: 'Timdont Cook',
    organization: 'Akvo DASH',
  },
};

const store = configureStore(initialState);
const rootElement = document.querySelector('#root');
render(<Root store={store}/>, rootElement);

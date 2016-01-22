import React from 'react';
import { render } from 'react-dom';
import Root from './containers/Root';
import configureStore from './store/configureStore';

const store = configureStore({});
const rootElement = document.querySelector('#root');
render(<Root store={store}/>, rootElement);

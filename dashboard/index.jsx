import React from 'react';
import { render } from 'react-dom';
import Root from './containers/Root';
import configureStore from './store/configureStore';

let store = configureStore({});
let rootElement = document.querySelector('#root');
render(<Root store={store}/>, rootElement);

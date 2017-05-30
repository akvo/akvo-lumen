import React from 'react';
import PropTypes from 'prop-types';
import { Provider } from 'react-redux';
import App from './App';
import DevTools from './DevTools';

export default function Root({ store, history }) {
  return (
    <Provider store={store}>
      <div>
        <App history={history} />
        <DevTools />
      </div>
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

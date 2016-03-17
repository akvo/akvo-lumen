import React, { PropTypes } from 'react';
import { Provider } from 'react-redux';
import App from './App';

export default function Root({ store, history }) {
  return (
    <Provider store={store}>
      <App history={history} />
    </Provider>
  );
}

Root.propTypes = {
  store: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
};

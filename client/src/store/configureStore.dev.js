import { createStore, applyMiddleware, compose } from 'redux';
import { persistState } from 'redux-devtools';
import thunkMiddleware from 'redux-thunk';
import { browserHistory } from 'react-router';
import { syncHistory } from 'react-router-redux';
import rootReducer from '../reducers/rootReducer';
import DevTools from '../containers/DevTools';

const reduxRouterMiddleware = syncHistory(browserHistory);

function getDebugSessionKey() {
  const matches = window.location.href.match(/[?&]debug_session=([^&]+)\b/);
  return (matches && matches.length > 0) ? matches[1] : null;
}

const finalCreateStore = compose(
  applyMiddleware(thunkMiddleware, reduxRouterMiddleware),
  DevTools.instrument(),
  persistState(getDebugSessionKey())
)(createStore);

export default function configureStore(initialState) {
  const store = finalCreateStore(rootReducer, initialState);
  reduxRouterMiddleware.listenForReplays(store);
  if (module.hot) {
    module.hot.accept('../reducers/rootReducer', () =>
      store.replaceReducer(require('../reducers/rootReducer'))
    );
  }
  return store;
}

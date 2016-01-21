import { createStore, applyMiddleware, compose } from 'redux';
import { persistState } from 'redux-devtools';
import thunkMiddleware from 'redux-thunk';
import { createHistory } from 'history';
import { reduxReactRouter, ReduxRouter } from 'redux-router';
import dashApp from '../reducers';
import DevTools from '../containers/DevTools';

const finalCreateStore = compose(
  applyMiddleware(thunkMiddleware),
	reduxReactRouter({ createHistory }),
  DevTools.instrument(),
  persistState(getDebugSessionKey())
)(createStore);

function getDebugSessionKey() {
  const matches = window.location.href.match(/[?&]debug_session=([^&]+)\b/);
  return (matches && matches.length > 0)? matches[1] : null;
}

export default function configureStore(initialState) {
  const store = finalCreateStore(dashApp, initialState);

  if (module.hot) {
    module.hot.accept('../reducers', () =>
      store.replaceReducer(require('../reducers'))
    );
  }
  return store;
}

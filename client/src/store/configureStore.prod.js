import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { browserHistory } from 'react-router';
import { syncHistory } from 'react-router-redux';
import rootReducer from '../reducers/rootReducer';

const reduxRouterMiddleware = syncHistory(browserHistory);

const finalCreateStore = compose(
  applyMiddleware(thunkMiddleware, reduxRouterMiddleware)
)(createStore);

export default function configureStore(initialState) {
  const store = finalCreateStore(rootReducer, initialState);
  reduxRouterMiddleware.listenForReplays(store);
  return store;
}

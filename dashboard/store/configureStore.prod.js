import { createStore, applyMiddleware, compose } from 'redux';
import rootReducer from '../reducers';
import thunkMiddleware from 'redux-thunk';
import { createHistory } from 'history';
import { reduxReactRouter } from 'redux-router';
import dashApp from '../reducers';

const finalCreateStore = compose(
  applyMiddleware(thunkMiddleware),
	reduxReactRouter({ createHistory })
)(createStore);

export default function configureStore(initialState) {
  return finalCreateStore(dashApp, initialState);
}

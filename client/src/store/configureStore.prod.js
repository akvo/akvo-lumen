import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import rootReducer from '../reducers/rootReducer';

const finalCreateStore = compose(
  applyMiddleware(thunkMiddleware)
)(createStore);

export default function configureStore(initialState) {
  const store = finalCreateStore(rootReducer, initialState);
  return store;
}

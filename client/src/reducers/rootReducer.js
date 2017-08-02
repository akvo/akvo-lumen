import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import library from './library';
import collections from './collections';
import activeModal from './activeModal';
import notification from './notification';

function profile(state = {}) {
  return state;
}

function env(state = {}) {
  return state;
}

const rootReducer = combineReducers({
  routing: routerReducer,
  library,
  collections,
  activeModal,
  profile,
  env,
  notification,
});

export default rootReducer;

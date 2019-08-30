import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import loadStatus from './loadStatus';
import library from './library';
import collections from './collections';
import activeModal from './activeModal';
import notification from './notification';
import print from './print';
import locale from './locale';
import users from './collections';

function profile(state = {}) {
  return state;
}

function env(state = {}) {
  return state;
}

const rootReducer = combineReducers({
  routing: routerReducer,
  loadStatus,
  library,
  collections,
  activeModal,
  profile,
  env,
  notification,
  print,
  locale,
  users,
});

export default rootReducer;

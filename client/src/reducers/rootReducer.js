import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';
import library from './library';
import collections from './collections';
import activeModal from './activeModal';
import notification from './notification';

function user(state = {}, action) {
  switch (action.type) {
    default: return state;
  }
}

const rootReducer = combineReducers({
  routing: routerReducer,
  library,
  collections,
  activeModal,
  user,
  notification,
});

export default rootReducer;

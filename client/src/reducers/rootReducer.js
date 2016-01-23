import { combineReducers } from 'redux';
import { routeReducer } from 'redux-simple-router';

import library from './library';

function collections(state = [], action) {
  switch (action.type) {
    default: return state;
  }
}

function user(state = {}, action) {
  switch (action.type) {
    default: return state;
  }
}

const rootReducer = combineReducers({
  routing: routeReducer,
  library,
  collections,
  user,
});

export default rootReducer;

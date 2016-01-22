import { combineReducers } from 'redux';
import { routeReducer } from 'redux-simple-router';

function reducer(state, action) {
  switch (action.type) {
    default: return state;
  }
}

const rootReducer = combineReducers(Object.assign({}, reducer, {
  routing: routeReducer,
}));

export default rootReducer;

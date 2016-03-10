import * as collection from '../constants/collection';

export const initialState = {};

function createCollection(state, coll) {
  const id = coll.id;
  return Object.assign({}, state, {
    [id]: coll,
  });
}

export default function collections(state = initialState, action) {
  switch (action.type) {
    case collection.CREATE:
      return createCollection(state, action.collection);
    default: return state;
  }
}

import * as constants from '../constants/collection';

export function createCollection(name) {
  const now = Date.now();
  const id = Math.random() * 1e9 | 0;

  return {
    type: constants.CREATE,
    collection: {
      id,
      name,
      entities: [],
      created: now,
      modified: now,
    },
  };
}

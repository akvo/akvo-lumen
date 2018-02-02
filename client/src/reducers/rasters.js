import * as constants from '../constants/raster';

export const initialState = {};

function createRaster(state, raster) {
  const id = raster.get('id');
  return Object.assign({}, state, {
    [id]: raster,
  });
}

function saveRasterSettings(state, raster) {
  const id = raster.get('id');
  const title = raster.get('title');
  return Object.assign({}, state, {
    [id]: state[id].set('title', title),
  });
}

function importRasterPending(state, raster) {
  const id = raster.get('id');
  return Object.assign({}, state, {
    [id]: raster,
  });
}

function importRasterFailure(state, { importId, reason, modified }) {
  const raster = state[importId].merge({
    status: 'FAILED',
    reason,
    modified,
  });

  return Object.assign({}, state, {
    [importId]: raster,
  });
}

function importRasterSuccess(state, { importId }) {
  const newState = Object.assign({}, state);
  delete newState[importId];
  return newState;
}

function saveRaster(state, raster) {
  const id = raster.get('id');
  return Object.assign({}, state, {
    [id]: raster.set('type', 'raster'),
  });
}

function saveRasters(state, ds) {
  return ds.reduce((result, raster) => {
    const id = raster.get('id');
    if (state[id] == null) {
      return Object.assign({}, result, {
        [id]: raster.set('type', 'raster'),
      });
    }
    return result;
  }, state);
}

function removeRaster(state, id) {
  const newState = Object.assign({}, state);
  delete newState[id];
  return newState;
}

function replaceRaster(state, { raster }) {
  return Object.assign({}, state, {
    [raster.get('id')]: raster,
  });
}

export default function rasters(state = initialState, action) {
  switch (action.type) {
    case constants.CREATE:
      return createRaster(state, action.raster);
    case constants.SAVE_SETTINGS:
      return saveRasterSettings(state, action.raster);
    case constants.IMPORT_RASTER_PENDING:
      return importRasterPending(state, action.raster);
    case constants.IMPORT_RASTER_FAILURE:
      return importRasterFailure(state, action);
    case constants.IMPORT_RASTER_SUCCESS:
      return importRasterSuccess(state, action);
    case constants.FETCH_RASTER_SUCCESS:
      return saveRaster(state, action.raster);
    case constants.FETCH_RASTERS_SUCCESS:
      return saveRasters(state, action.rasters);
    case constants.REMOVE_RASTER:
      return removeRaster(state, action.id);
    case constants.REPLACE_RASTER:
      return replaceRaster(state, action);
    default: return state;
  }
}

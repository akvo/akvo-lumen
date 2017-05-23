import * as constants from '../constants/notification';

export const initialState = null;

export default function notification(state = initialState, action) {
  switch (action.type) {
    case constants.SHOW_NOTIFICATION:
      return { level: action.level, message: action.message, autohide: action.autohide };
    case constants.HIDE_NOTIFICATION:
      return null;
    default: return state;
  }
}

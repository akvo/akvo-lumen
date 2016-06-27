import * as constants from '../constants/notification';

export function showNotification(level, message) {
  return {
    type: constants.SHOW_NOTIFICATION,
    level,
    message,
  };
}

export function hideNotification() {
  return {
    type: constants.HIDE_NOTIFICATION,
  };
}

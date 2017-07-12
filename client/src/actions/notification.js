import * as constants from '../constants/notification';

/**
 * Available notification levels: info, warn, error.
 */
export function showNotification(level, message, autohide = false) {
  return {
    type: constants.SHOW_NOTIFICATION,
    level,
    message,
    autohide: Boolean(autohide),
  };
}

export function hideNotification() {
  return {
    type: constants.HIDE_NOTIFICATION,
  };
}

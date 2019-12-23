import * as constants from '../constants/locale';

// eslint-disable-next-line import/prefer-default-export
export function changeLocale(locale) {
  return {
    type: constants.CHANGE_LOCALE,
    locale,
  };
}

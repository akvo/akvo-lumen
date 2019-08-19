import * as constants from '../constants/locale';

export const initialState = null;

export default (state = initialState, action) => {
  switch (action.type) {
    case `${constants.CHANGE_LOCALE}`: {
      return action.locale;
    }
    default: {
      return state;
    }
  }
};

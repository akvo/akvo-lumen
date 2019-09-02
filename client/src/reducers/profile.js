import * as constants from '../constants/user';

export const initialState = {
  firstName: null,
  lastName: null,
};

function updateUserSuccess(state, action) {
  const { firstName, lastName } = action.user;
  return Object.assign({}, state, {
    firstName,
    lastName,
  });
}

export default function profile(state = initialState, action) {
  switch (action.type) {
    case constants.UPDATE_USER_SUCCESS:
      return updateUserSuccess(state, action);
    default: return state;
  }
}

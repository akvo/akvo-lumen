import * as api from '../utilities/api';
import { showNotification } from './notification';
import * as constants from '../constants/user';

export function updateUserRequest(user) {
  return {
    type: constants.UPDATE_USER_REQUEST,
    user,
  };
}

export function updateUserSuccess(user) {
  return {
    type: constants.UPDATE_USER_SUCCESS,
    user,
  };
}

export function updateUserFailure(user, error) {
  return {
    type: constants.UPDATE_USER_FAILURE,
    user,
    error,
  };
}

export function updateUser(user) {
  return (dispatch) => {
    dispatch(updateUserRequest);
    api.patch('/api/user/me', user)
      .then((updatedUser) => {
        const { firstName, lastName } = updatedUser.body;
        dispatch(updateUserSuccess({ firstName, lastName }));
      })
      .catch((error) => {
        dispatch(showNotification('error', 'Failed to update name.'));
        dispatch(updateUserFailure(error));
      });
  };
}

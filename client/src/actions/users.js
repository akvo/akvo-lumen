import warning from 'warning';
import { Immutable } from 'immutable';
import { get } from '../api';
import * as constants from '../constants/library';

function fetchUsersRequest() {
  return {
    type: constants.FETCH_USERS_REQUEST,
  };
}

function fetchUsersFailure() {
  return {
    type: constants.FETCH_USERS_FAILURE,
  };
}

export function fetchUsers() {
  return (dispatch) => {
    dispatch(fetchUsersRequest());
    get('/api/users')
      .then((users) => {
         // ???
      })
      .catch((error) => {
        warning(false, 'Failed to fetch user list: %s', error.message);
        dispatch(fetchUsersFailure(error));
      });
  };
}

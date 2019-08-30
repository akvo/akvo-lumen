import { createAction } from 'redux-actions';

/* Edit an existing collection */
export const editUserRequest = createAction('EDIT_USER_REQUEST');
export const editUserFailure = createAction('EDIT_USER_FAILURE');
export const editUserSuccess = createAction('EDIT_USER_SUCCESS');

export function editUser(user) {
  return (dispatch) => {
    dispatch(editUserRequest);
    console.log('Do HTTP request');
    dispatch(editUserSuccess(user));
  };
}

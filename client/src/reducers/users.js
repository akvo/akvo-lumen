import { handleActions } from 'redux-actions';
import * as actions from '../actions/collection';

export const initialState = null;

function editUser(state, { payload }) {
  console.log('@editUser:reducer');
  const id = payload.id;
  return Object.assign({}, state, {
    [id]: payload,
  });
}

export default handleActions({
  [actions.editUserSuccess]: editUser,
}, initialState);

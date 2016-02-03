import * as constants from '../constants/activeModal';


export function showModal(modalName) {
  return {
    type: constants.SHOW,
    modal: modalName,
  };
}

export function hideModal() {
  return {
    type: constants.HIDE,
  };
}

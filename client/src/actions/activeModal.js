import * as constants from '../constants/activeModal';

export function showModal(modalName, opts = {}) {
  return {
    type: constants.SHOW,
    modal: modalName,
    opts,
  };
}

export function hideModal() {
  return {
    type: constants.HIDE,
  };
}

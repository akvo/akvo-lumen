import * as constants from '../constants/print';

export function printBegin(dimensions) {
  return {
    type: constants.PRINT_BEGIN,
    payload: { dimensions },
  };
}

export function printEnd() {
  return {
    type: constants.PRINT_END,
  };
}
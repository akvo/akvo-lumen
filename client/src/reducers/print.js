
import * as constants from '../constants/print';

const defaultState = {
  isPrinting: false,
  dimensions: {
    width: 1024,
    height: 600,
  },
};

export default (state = defaultState, action) => {
  switch(action.type) {
    case `${constants.PRINT_BEGIN}`: {
      return {
        isPrinting: true,
        dimensions: action.payload.dimensions,
      };
    }
    case `${constants.PRINT_END}`: {
      return {
        ...state,
        isPrinting: false,
      };
    }
    default: {
      return state;
    }
  }
};

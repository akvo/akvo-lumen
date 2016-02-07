export const initialState = {
  102: {
    id: 102,
    name: 'visualisation 1',
    type: 'visualisation',
    created: '1449873058414',
  },
  104: {
    id: 104,
    name: 'visualisation 2',
    type: 'visualisation',
    created: '1448146165194',
    modified: '1469109685570',

  },
  109: {
    id: 109,
    name: 'visualisation 3',
    type: 'visualisation',
    created: '1449873058411',
  },
};

export default function visualisations(state = initialState, action) {
  switch (action.type) {
    default: return state;
  }
}

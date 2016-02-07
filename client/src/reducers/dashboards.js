export const initialState = {
  111: {
    id: 111,
    name: 'dashboard 1',
    type: 'dashboard',
    created: '1451733263303',
  },
  115: {
    id: 115,
    name: 'dashboard 2',
    type: 'dashboard',
    created: '1453144612699',
  },
  121: {
    id: 121,
    name: 'dashboard 3',
    type: 'dashboard',
    created: '1449108685770',
    modified: '1482909685570',
  },
};

export default function dashboards(state = initialState, action) {
  switch (action.type) {
    default: return state;
  }
}

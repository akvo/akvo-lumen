
// TODO: Depend on column type!
const options = [{
  label: 'Filter',
  value: 'filter',
}, {
  label: 'Sort',
  value: 'sort',
  subMenu: [{
    label: 'Ascending',
    value: 'sort-ascending',
  }, {
    label: 'Descending',
    value: 'sort-descending',
  }],
}, {
  label: 'Whitespace',
  value: 'whitespace',
  subMenu: [{
    label: 'Remove leading and trailing whitespace',
    value: 'remove-leading-trailing-whitespace',
  }, {
    label: 'Remove double spaces',
    value: 'remove-double-whitespace',
  }],
}, {
  label: 'Change case',
  value: 'change-case',
  subMenu: [{
    label: 'To Uppercase',
    value: 'to-uppercase',
  }, {
    label: 'To Lowercase',
    value: 'to-lowercase',
  }, {
    label: 'To Titlecase',
    value: 'to-titlecase',
  }],
}];

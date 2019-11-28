import React from 'react';
import PropTypes from 'prop-types';
import { intlShape, injectIntl } from 'react-intl';
import Immutable from 'immutable';
import Select from 'react-select';
import { reducerGroup, datasetHasQuestionGroups } from './../../utilities/utils';

// require('../../../node_modules/react-select/dist/react-select.css');
require('./SelectMenu.scss');

function SelectMenu(props) {
  let placeholder;
  if (props.placeholderId != null) {
    placeholder = props.intl.formatMessage({ id: props.placeholderId });
  } else if (props.placeholder != null) {
    placeholder = props.placeholder;
  } else {
    placeholder = `${props.intl.formatMessage({ id: 'select' })}...`;
  }
  let options;
  const columns = Immutable.fromJS(props.options);
  const l = columns.find(c => c.get('value') === props.value);
  const selectedOption = l ? { value: l.get('value'), label: l.get('label') } : {};
//  console.log(l, props.value, selectedOption, JSON.stringify(columns));

  function extractColumnOptions(cc) {
    return cc.map((c) => {
      const value = c.get('value');
      const label = c.get('label');
      const labelId = c.get('labelId');
      return {
        label: labelId ? props.intl.formatMessage({ id: labelId }) : label,
        value,
      };
    });
  }
  if (props.options.length > 0 && datasetHasQuestionGroups(columns)) {
    const groups = columns.reduce(reducerGroup(props.intl.formatMessage({ id: 'form_metadata' }), props.intl.formatMessage({ id: 'transformations' })), {});
    const reducer2 = (accumulator, k) => {
      const columnsGroup = groups[k];
      accumulator.push({ label: k, options: extractColumnOptions(columnsGroup) });
      return accumulator;
    };
    options = Object.keys(groups).reduce(reducer2, []);
  } else {
    options = extractColumnOptions(columns);
  }
  // eslint-disable-next-line react/prop-types
  return (
    <div className={`SelectMenu ${props.disabled ? 'disabled' : 'enabled'}`}>
      <Select
        {...props}
        value={selectedOption}
        options={options}
        onChange={(option) => {
//          console.log(option);
          if (option) {
            props.onChange(props.multi ? option : option.value);
          } else {
            props.onChange(null);
          }
        }}
        clearable={props.clearable || false}
        searchable={props.searchable || false}
        placeholder={placeholder}
        inputProps={props.inputProps}
      />
    </div>
  );
}

SelectMenu.propTypes = {
  intl: intlShape.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    labelId: PropTypes.string,
  })).isRequired,
  placeholder: PropTypes.string,
  placeholderId: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  multi: PropTypes.bool,
  disabled: PropTypes.bool,
  inputProps: PropTypes.object,
};

export default injectIntl(SelectMenu);

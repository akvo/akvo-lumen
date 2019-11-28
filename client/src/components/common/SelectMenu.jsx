import React from 'react';
import PropTypes from 'prop-types';
import { intlShape, injectIntl } from 'react-intl';
import Select from 'react-select';

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
  return (
    <div className={`SelectMenu ${props.disabled ? 'disabled' : 'enabled'}`}>
      <Select
        {...props}
        options={props.options.map(({ value, label, labelId }) => ({
          label: labelId ? props.intl.formatMessage({ id: labelId }) : label,
          value,
        }))}
        onChange={(option) => {
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

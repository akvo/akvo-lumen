import React, { PropTypes } from 'react';
import Select from 'react-select';

require('../../../node_modules/react-select/dist/react-select.css');
require('./SelectMenu.scss');

export default function SelectMenu(props) {
  return (
    <div className={`SelectMenu ${props.disabled ? 'disabled' : 'enabled'}`}>
      <Select
        {...props}
        onChange={(option) => {
          if (option) {
            props.onChange(props.multi ? option : option.value);
          } else {
            props.onChange(null);
          }
        }}
        clearable={props.clearable || false}
        searchable={props.searchable || false}
      />
    </div>
  );
}

SelectMenu.propTypes = {
  options: PropTypes.arrayOf(React.PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string.isRequired,
  })).isRequired,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
  multi: PropTypes.bool,
  disabled: PropTypes.bool,
};

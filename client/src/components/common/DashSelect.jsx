import React, { PropTypes } from 'react';
import Select from 'react-select';

require('../../../node_modules/react-select/dist/react-select.css');
require('../../styles/DashSelect.scss');

export default function DashSelect(props) {
  return (
    <div className="DashSelect">
      <Select
        {...props}
        onChange={option => props.onChange(option.value)}
        clearable={props.clearable || false}
        searchable={props.searchable || false}
      />
    </div>
  );
}

DashSelect.propTypes = {
  options: PropTypes.arrayOf(React.PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
  placeholder: PropTypes.string,
  name: PropTypes.string,
  onChange: PropTypes.func,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
};

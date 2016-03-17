import React, { PropTypes } from 'react';
import Select from 'react-select';

require('../../../node_modules/react-select/dist/react-select.css');
require('../../styles/DashSelect.scss');

export default function DashSelect(props) {
  return (
    <div className="DashSelect">
      <Select
        {...props}
        clearable={props.clearable || false}
        searchable={props.searchable || false}
      />
    </div>
  );
}

DashSelect.propTypes = {
  options: PropTypes.array.isRequired,
  name: PropTypes.string,
  onChange: PropTypes.func,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
};

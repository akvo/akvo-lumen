import React, { Component, PropTypes } from 'react';
import Select from 'react-select';

require('../../../node_modules/react-select/dist/react-select.css');
require('../../styles/DashSelect.scss');

export default class DashSelect extends Component {
  render() {
    return (
      <div className="DashSelect">
        <Select
          {...this.props}
          clearable={this.props.clearable || false}
          searchable={this.props.searchable || false}
        />
      </div>
    );
  }
}

DashSelect.propTypes = {
  options: PropTypes.array.isRequired,
  name: PropTypes.string,
  onChange: PropTypes.func,
  clearable: PropTypes.bool,
  searchable: PropTypes.bool,
};

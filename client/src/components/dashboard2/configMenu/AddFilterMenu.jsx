import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';


class AddFilterMenu extends Component {

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {
    return (
      <h4>Add filter</h4>
    );
  }
}

AddFilterMenu.propTypes = {
  intl: intlShape,
  onAddFilter: PropTypes.func.isRequired,
};

export default AddFilterMenu;

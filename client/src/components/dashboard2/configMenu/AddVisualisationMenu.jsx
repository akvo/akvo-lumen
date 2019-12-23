import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';

class AddVisualisationMenu extends Component {

  constructor(props) {
    super(props);
    this.state = {

    };
  }

  render() {
    return (
      <h4>Add visualisation</h4>
    );
  }
}

AddVisualisationMenu.propTypes = {
  intl: intlShape,
  onAddVisualisation: PropTypes.func.isRequired,
};

export default AddVisualisationMenu;

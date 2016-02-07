import React, { Component, PropTypes } from 'react';

export default class DatasetHeader extends Component {

  render() {
    return (
      <div>
        <h1>{this.props.name}</h1>
        <button onClick={this.props.onShowDatasetSettings}>...</button>
        { /*
          Additional stuff in the header:
          Share dataset with user,
          Info button
          Visualisation count
          More actions
          */ }
      </div>
    );
  }
}

DatasetHeader.propTypes = {
  name: PropTypes.string.isRequired,
  onShowDatasetSettings: PropTypes.func.isRequired,
};

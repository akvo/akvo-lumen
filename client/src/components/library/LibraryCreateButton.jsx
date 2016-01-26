import React, { Component, PropTypes } from 'react';

export default class LibraryCreateButton extends Component {
  render() {
    const { onCreate } = this.props;
    return (
      <select
        className="LibraryCreateButton"
        onChange={evt => onCreate(evt.target.value)} value="new"
      >
        <option value="new">New</option>
        <option value="dataset">Dataset</option>
        <option value="visualisation">Visualisation</option>
        <option value="dashboard">Dashboard</option>
      </select>
    );
  }
}

LibraryCreateButton.propTypes = {
  onCreate: PropTypes.func.isRequired,
};

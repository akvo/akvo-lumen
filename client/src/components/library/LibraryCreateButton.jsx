import React, { Component, PropTypes } from 'react';
import DashSelect from '../common/DashSelect';

export default class LibraryCreateButton extends Component {
  render() {
    const { onCreate } = this.props;
    const options = [
      { value: 'dataset', label: 'Dataset' },
      { value: 'visualisation', label: 'Visualisation' },
      { value: 'dashboard', label: 'Dashboard' },
      { value: 'collection', label: 'Collection' },
    ];
    const onChange = (value) => {
      onCreate(value);
      // Force a rerender so menu still shows placeholder
      this.forceUpdate();
    };

    return (
      <div className="LibraryCreateButton">
        <DashSelect
          name="create-button"
          options={options}
          onChange={onChange}
          placeholder="New"
        />
      </div>
    );
  }
}

LibraryCreateButton.propTypes = {
  onCreate: PropTypes.func.isRequired,
};

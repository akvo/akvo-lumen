import React, { Component, PropTypes } from 'react';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DatasetHeader extends Component {
  getActionButtions() {
    const settings = {
      buttonText: 'Settings',
      onClick: this.props.onShowDatasetSettings,
    };

    return [settings];
  }
  render() {
    return (
      <EntityTypeHeader
        title={this.props.name}
        actionButtons={this.getActionButtions()}
      />
    );
  }
}

DatasetHeader.propTypes = {
  name: PropTypes.string.isRequired,
  onShowDatasetSettings: PropTypes.func.isRequired,
};

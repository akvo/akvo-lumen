import React, { Component, PropTypes } from 'react';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DatasetHeader extends Component {

  render() {
    return (
      <EntityTypeHeader
        title={this.props.name}
      />
    );
  }
}

DatasetHeader.propTypes = {
  name: PropTypes.string.isRequired,
  onShowDatasetSettings: PropTypes.func.isRequired,
};

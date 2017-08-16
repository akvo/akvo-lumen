import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DatasetHeader extends Component {
  getActionButtions() {
    const settings = {
      buttonText: <FormattedMessage id="settings" />,
      onClick: this.props.onShowDatasetSettings,
      customClass: 'notImplemented',
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

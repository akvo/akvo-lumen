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
    const { onChangeTitle, onBeginEditTitle, isUnsavedChanges } = this.props;

    const saveStatusId = ({
      false: 'all_changes_saved',
      true: 'unsaved_changes',
    })[isUnsavedChanges] || null;

    return (
      <EntityTypeHeader
        title={this.props.name}
        actionButtons={this.getActionButtions()}
        onChangeTitle={onChangeTitle}
        onBeginEditTitle={onBeginEditTitle}
        saveStatusId={saveStatusId}
      />
    );
  }
}

DatasetHeader.propTypes = {
  name: PropTypes.string.isRequired,
  onShowDatasetSettings: PropTypes.func.isRequired,
  isUnsavedChanges: PropTypes.bool,
  onChangeTitle: PropTypes.func,
  onBeginEditTitle: PropTypes.func,
};

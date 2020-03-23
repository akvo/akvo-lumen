import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DatasetHeader extends Component {
  getActionButtions() {
    const save = {
      buttonText: <FormattedMessage id="save" />,
      primary: true,
      onClick: () => {
        this.props.onSaveDataset();
      },
      customClass: 'primaryButton',
      props: {
        'data-test-id': 'save-changes',
      },
    };

    const settings = {
      buttonText: <FormattedMessage id="settings" />,
      onClick: this.props.onShowDatasetSettings,
      customClass: 'notImplemented',
    };

    const result = [settings];

    if (this.props.savingFailed) result.unshift(save);

    return result;
  }

  render() {
    const {
      onChangeTitle,
      onBeginEditTitle,
      isUnsavedChanges,
      savingFailed,
      timeToNextSave,
      history,
    } = this.props;

    let saveStatusId = ({
      false: 'all_changes_saved',
      true: 'unsaved_changes',
    })[isUnsavedChanges] || null;

    if (savingFailed && timeToNextSave) {
      saveStatusId = 'saving_failed_countdown';
    }

    return (
      <EntityTypeHeader
        history={history}
        title={this.props.name}
        actionButtons={this.getActionButtions()}
        onChangeTitle={onChangeTitle}
        onBeginEditTitle={onBeginEditTitle}
        saveStatusId={saveStatusId}
        savingFailed={savingFailed}
        timeToNextSave={timeToNextSave}
      />
    );
  }
}

DatasetHeader.propTypes = {
  savingFailed: PropTypes.bool,
  timeToNextSave: PropTypes.number,
  name: PropTypes.string.isRequired,
  onShowDatasetSettings: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  onSaveDataset: PropTypes.func.isRequired,
  isUnsavedChanges: PropTypes.bool,
  onChangeTitle: PropTypes.func,
  onBeginEditTitle: PropTypes.func,
};

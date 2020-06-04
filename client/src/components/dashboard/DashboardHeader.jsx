import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';

import EntityTypeHeader from '../entity-editor/EntityTypeHeader';
import LoadingSpinner from '../common/LoadingSpinner';

class DashboardHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons(isUnsavedChanges) {
    const { onDashboardAction, isExporting } = this.props;

    const user = {
      buttonText: <FormattedMessage id="user" />,
      customClass: 'notImplemented',
    };
    const download = {
      buttonText: <FormattedMessage id="download" />,
      customClass: 'notImplemented',
    };
    const disableShare = isUnsavedChanges == null || isUnsavedChanges;
    const share = {
      buttonText: <FormattedMessage id="share" />,
      onClick: () => onDashboardAction('share'),
      disabled: disableShare,
      tooltipId: disableShare ? 'save_your_dashboard_before_sharing' : null,
    };

    const exportButton = {
      buttonText: <FormattedMessage id="export" />,
      disabled: disableShare || isExporting,
      tooltipId: disableShare ? 'save_your_dashboard_before_exporting' : null,
      onOptionSelected: format => onDashboardAction(`export_${format}`),
      icon: isExporting ? <LoadingSpinner /> : null,
      subActions: [
        {
          label: <FormattedMessage id="png" />,
          value: 'png',
        },
        {
          label: <FormattedMessage id="pdf" />,
          value: 'pdf',
        },
      ],
    };

    const overflow = {
      buttonText: <FormattedMessage id="overflow" />,
      customClass: 'notImplemented',
    };

    const result = [
      user,
      download,
      share,
      exportButton,
      overflow,
    ];

    return result;
  }

  render() {
    const {
      isUnsavedChanges,
      savingFailed,
      timeToNextSave,
      intl,
      history,
      onSaveDashboard,
    } = this.props;

    const actionButtons = this.getActionButtons(isUnsavedChanges);
    let saveStatusId;

    switch (isUnsavedChanges) {
      case false:
        saveStatusId = 'all_changes_saved';
        break;
      case true:
        saveStatusId = 'unsaved_changes';
        break;
      default:
        saveStatusId = null;
    }

    if (savingFailed && timeToNextSave) {
      saveStatusId = 'saving_failed_countdown';
    }

    return (
      <EntityTypeHeader
        title={
          this.props.title || intl.formatMessage({ id: 'untitled_dashboard' })
        }
        onChangeTitle={this.props.onChangeTitle}
        onBeginEditTitle={this.props.onBeginEditTitle}
        saveStatusId={saveStatusId}
        actionButtons={actionButtons}
        saveAction={onSaveDashboard}
        savingFailed={savingFailed}
        timeToNextSave={timeToNextSave}
        history={history}
      />
    );
  }
}

DashboardHeader.propTypes = {
  intl: intlShape,
  isUnsavedChanges: PropTypes.bool,
  savingFailed: PropTypes.bool,
  timeToNextSave: PropTypes.number,
  title: PropTypes.string.isRequired,
  onDashboardAction: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onSaveDashboard: PropTypes.func.isRequired,
  onBeginEditTitle: PropTypes.func.isRequired,
  isExporting: PropTypes.bool,
};

export default injectIntl(DashboardHeader);

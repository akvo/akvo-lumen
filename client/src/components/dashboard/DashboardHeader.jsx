import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, intlShape, injectIntl } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

class DashboardHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons(isUnsavedChanges, haveTitle) {
    const { onDashboardAction } = this.props;

    const save = {
      buttonText: <FormattedMessage id="save" />,
      primary: true,
      onClick: () => {
        this.props.onSaveDashboard();
      },
      customClass: `primaryButton ${haveTitle ? '' : 'disabled'}`,
      disabled: !haveTitle,
      props: {
        'data-test-id': 'save-changes',
      },
    };

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
    const overflow = {
      buttonText: <FormattedMessage id="overflow" />,
      customClass: 'notImplemented',
    };

    const result = [
      user,
      download,
      share,
      overflow,
    ];

    if (this.props.savingFailed) result.unshift(save);

    return result;
  }

  render() {
    const { isUnsavedChanges, savingFailed, timeToNextSave, intl } = this.props;
    const haveTitle = Boolean(this.props.title);

    const actionButtons = this.getActionButtons(isUnsavedChanges, haveTitle);
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
        title={this.props.title || intl.formatMessage({ id: 'untitled_dashboard' })}
        onChangeTitle={this.props.onChangeTitle}
        onBeginEditTitle={this.props.onBeginEditTitle}
        saveStatusId={saveStatusId}
        actionButtons={actionButtons}
        savingFailed={savingFailed}
        timeToNextSave={timeToNextSave}
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
  onChangeTitle: PropTypes.func.isRequired,
  onSaveDashboard: PropTypes.func.isRequired,
  onBeginEditTitle: PropTypes.func.isRequired,
};

export default injectIntl(DashboardHeader);

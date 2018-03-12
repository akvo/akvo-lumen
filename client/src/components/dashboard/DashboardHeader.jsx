import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DashboardHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons(isUnsavedChanges) {
    const { onDashboardAction } = this.props;

    const save = {
      buttonText: <FormattedMessage id="save" />,
      primary: true,
      onClick: () => {
        this.props.onSaveDashboard();
      },
      customClass: 'primaryButton',
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

    return ([
      save,
      user,
      download,
      share,
      overflow,
    ]);
  }

  render() {
    const { isUnsavedChanges } = this.props;

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

    return (
      <EntityTypeHeader
        title={this.props.title || 'Untitled dashboard'}
        onChangeTitle={this.props.onChangeTitle}
        onBeginEditTitle={this.props.onBeginEditTitle}
        saveStatusId={saveStatusId}
        actionButtons={actionButtons}
      />
    );
  }
}

DashboardHeader.propTypes = {
  isUnsavedChanges: PropTypes.bool,
  title: PropTypes.string.isRequired,
  onDashboardAction: PropTypes.func.isRequired,
  onChangeTitle: PropTypes.func.isRequired,
  onSaveDashboard: PropTypes.func.isRequired,
  onBeginEditTitle: PropTypes.func.isRequired,
};

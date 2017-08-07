import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DashboardHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons() {
    const { onDashboardAction } = this.props;
    const user = {
      buttonText: <FormattedMessage id="user" />,
      customClass: 'notImplemented',
    };
    const download = {
      buttonText: <FormattedMessage id="download" />,
      customClass: 'notImplemented',
    };
    const share = {
      buttonText: <FormattedMessage id="share" />,
      onClick: () => onDashboardAction('share'),
    };
    const overflow = {
      buttonText: <FormattedMessage id="overflow" />,
      customClass: 'notImplemented',
    };

    return ([
      user,
      download,
      share,
      overflow,
    ]);
  }

  render() {
    const actionButtons = this.getActionButtons();
    let saveStatusId;

    switch (this.props.isUnsavedChanges) {
      case false:
        saveStatusId = 'All changes saved';
        break;
      case true:
        saveStatusId = 'Unsaved changes';
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
  onBeginEditTitle: PropTypes.func.isRequired,
};

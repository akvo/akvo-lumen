import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DashboardHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons() {
    const { onDashboardAction } = this.props;
    const user = {
      buttonText: 'User',
      customClass: 'notImplemented',
    };
    const download = {
      buttonText: 'Download',
      customClass: 'notImplemented',
    };
    const share = {
      buttonText: 'Share',
      onClick: () => onDashboardAction('share'),
    };
    const overflow = {
      buttonText: 'Overflow',
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
    let saveStatus;

    switch (this.props.isUnsavedChanges) {
      case false:
        saveStatus = 'All changes saved';
        break;
      case true:
        saveStatus = 'Unsaved changes';
        break;
      default:
        saveStatus = '';
    }

    return (
      <EntityTypeHeader
        title={this.props.title || 'Untitled dashboard'}
        onChangeTitle={this.props.onChangeTitle}
        onBeginEditTitle={this.props.onBeginEditTitle}
        saveStatus={saveStatus}
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

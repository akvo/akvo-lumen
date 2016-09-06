import React, { Component, PropTypes } from 'react';
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
    };
    const download = {
      buttonText: 'Download',
    };
    const share = {
      buttonText: 'Share',
      onClick: () => onDashboardAction('share'),
    };
    const overflow = {
      buttonText: 'Overflow',
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
    const saveStatus = '';

    return (
      <EntityTypeHeader
        title={this.props.dashboard.title || 'Untitled dashboard'}
        saveStatus={saveStatus}
        actionButtons={actionButtons}
      />
    );
  }
}

DashboardHeader.propTypes = {
  isUnsavedChanges: PropTypes.bool,
  dashboard: PropTypes.shape({
    title: PropTypes.string.isRequired,
  }).isRequired,
  onDashboardAction: PropTypes.func.isRequired,
};

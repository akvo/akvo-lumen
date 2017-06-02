import React, { Component } from 'react';
import PropTypes from 'prop-types';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class VisualisationHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons() {
    const { onVisualisationAction } = this.props;
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
      onClick: () => onVisualisationAction('share'),
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
        title={this.props.visualisation.name || 'Untitled visualisation'}
        onChangeTitle={this.props.onChangeTitle}
        onBeginEditTitle={this.props.onBeginEditTitle}
        saveStatus={saveStatus}
        actionButtons={actionButtons}
      />
    );
  }
}

VisualisationHeader.propTypes = {
  isUnsavedChanges: PropTypes.bool.isRequired,
  visualisation: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  onVisualisationAction: PropTypes.func.isRequired,
  onChangeTitle: PropTypes.func,
  onBeginEditTitle: PropTypes.func,
};

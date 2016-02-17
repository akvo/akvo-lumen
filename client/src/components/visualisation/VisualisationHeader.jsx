import React, { Component, PropTypes } from 'react';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class VisualisationHeader extends Component {
  getActionButtons() {
    const user = {
      buttonText: 'User',
    };
    const download = {
      buttonText: 'Download',
    };
    const share = {
      buttonText: 'Share',
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
    let saveStatus;

    switch (this.props.visualisation.isUnsavedChanges) {
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
        saveStatus={saveStatus}
        actionButtons={actionButtons}
      />
    );
  }
}

VisualisationHeader.propTypes = {
  visualisation: PropTypes.object.isRequired,
};

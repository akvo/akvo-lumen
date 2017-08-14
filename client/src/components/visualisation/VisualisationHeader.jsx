import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class VisualisationHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons() {
    const { onVisualisationAction } = this.props;
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
      onClick: () => onVisualisationAction('share'),
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
        title={this.props.visualisation.name || 'Untitled visualisation'}
        onChangeTitle={this.props.onChangeTitle}
        onBeginEditTitle={this.props.onBeginEditTitle}
        saveStatusId={saveStatusId}
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

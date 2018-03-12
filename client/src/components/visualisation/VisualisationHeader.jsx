import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class VisualisationHeader extends Component {

  constructor() {
    super();
    this.getActionButtons = this.getActionButtons.bind(this);
  }

  getActionButtons(isUnsavedChanges) {
    const { onVisualisationAction } = this.props;
    const save = {
      buttonText: <FormattedMessage id="save" />,
      primary: true,
      onClick: () => {
        this.props.onSaveVisualisation();
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
    const disableShare = isUnsavedChanges || isUnsavedChanges == null;
    const share = {
      buttonText: <FormattedMessage id="share" />,
      onClick: () => onVisualisationAction('share'),
      disabled: disableShare,
      tooltipId: disableShare ? 'save_your_visualisation_before_sharing' : null,
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

    if (isUnsavedChanges) {
      result.unshift(save);
    }

    return result;
  }

  render() {
    const { visualisation, onChangeTitle, onBeginEditTitle, isUnsavedChanges } = this.props;

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
        title={visualisation.name || 'Untitled visualisation'}
        onChangeTitle={onChangeTitle}
        onBeginEditTitle={onBeginEditTitle}
        saveStatusId={saveStatusId}
        actionButtons={actionButtons}
      />
    );
  }
}

VisualisationHeader.propTypes = {
  isUnsavedChanges: PropTypes.bool,
  visualisation: PropTypes.shape({
    name: PropTypes.string.isRequired,
  }).isRequired,
  onVisualisationAction: PropTypes.func.isRequired,
  onSaveVisualisation: PropTypes.func.isRequired,
  onChangeTitle: PropTypes.func,
  onBeginEditTitle: PropTypes.func,
};

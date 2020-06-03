import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default class DatasetHeader extends Component {
  getActionButtions() {
    const save = {
      buttonText: <FormattedMessage id="save" />,
      primary: true,
      onClick: () => {
        this.props.onSaveDataset();
      },
      customClass: 'primaryButton',
      props: {
        'data-test-id': 'save-changes',
      },
    };

    const settings = {
      buttonText: <FormattedMessage id="settings" />,
      onClick: this.props.onShowDatasetSettings,
      customClass: 'notImplemented',
    };

    const transform = {
      buttonText: <FormattedMessage id="transform" />,
      customClass: this.props.isLockedFromTransformations
        ? "disabled"
        : "clickable",
      onOptionSelected: item => {
        this.props.onClickTransformMenuItem(item)
      },
      subActions: [
        {
          label: <FormattedMessage id="bulk_row_editor" />,
          value: "bulk-row-editor",
          customClass: "notImplemented"
        },
        {
          label: <FormattedMessage id="bulk_column_editor" />,
          value: "bulk-column-editor",
          customClass: "notImplemented"
        },
        {
          label: <FormattedMessage id="combine_columns" />,
          value: "combineColumns"
        },
        {
          label: <FormattedMessage id="extract_multiple" />,
          value: "extractMultiple"
        },
        {
          label: <FormattedMessage id="split_column" />,
          value: "splitColumn"
        },
        {
          label: <FormattedMessage id="derive_column" />,
          value: "deriveColumn",
          subMenu: [
            {
              label: <FormattedMessage id="derive_column_category" />,
              value: "deriveColumnCategory"
            },
            {
              label: <FormattedMessage id="derive_column_javascript" />,
              value: "deriveColumnJavascript"
            }
          ]
        },
        {
          label: <FormattedMessage id="merge_datasets" />,
          value: "mergeDatasets"
        },
        {
          label: <FormattedMessage id="generate_geopoints" />,
          value: "generateGeopoints"
        },
        {
          label: <FormattedMessage id="reverse_geocode" />,
          value: "reverseGeocode"
        }
      ]
    };

    const transformationLog = {
      icon: <i className="fa fa-list-ol" aria-hidden="true" />,
      onClick: this.props.onToggleTransformationLog
    };

    const visualise = {
      buttonText: <FormattedMessage id="visualise" />,
      onClick: this.props.onNavigateToVisualise
    };

    const result = [settings, transform, transformationLog, visualise];

    if (this.props.savingFailed) result.unshift(save);

    return result;
  }

  render() {
    const {
      onChangeTitle,
      onBeginEditTitle,
      isUnsavedChanges,
      savingFailed,
      timeToNextSave,
      history,
    } = this.props;

    let saveStatusId = ({
      false: 'all_changes_saved',
      true: 'unsaved_changes',
    })[isUnsavedChanges] || null;

    if (savingFailed && timeToNextSave) {
      saveStatusId = 'saving_failed_countdown';
    }

    return (
      <EntityTypeHeader
        history={history}
        title={this.props.name}
        actionButtons={this.getActionButtions()}
        onChangeTitle={onChangeTitle}
        onBeginEditTitle={onBeginEditTitle}
        saveStatusId={saveStatusId}
        savingFailed={savingFailed}
        timeToNextSave={timeToNextSave}
      />
    );
  }
}

DatasetHeader.propTypes = {
  savingFailed: PropTypes.bool,
  timeToNextSave: PropTypes.number,
  name: PropTypes.string.isRequired,
  onShowDatasetSettings: PropTypes.func.isRequired,
  history: PropTypes.object.isRequired,
  onSaveDataset: PropTypes.func.isRequired,
  isUnsavedChanges: PropTypes.bool,
  onChangeTitle: PropTypes.func,
  onBeginEditTitle: PropTypes.func,
  onNavigateToVisualise: PropTypes.func.isRequired,
  isLockedFromTransformations: PropTypes.bool,
  onClickTransformMenuItem: PropTypes.func,
  onToggleTransformationLog: PropTypes.func
};

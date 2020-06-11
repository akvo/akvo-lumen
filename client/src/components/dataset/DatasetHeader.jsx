import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import EntityTypeHeader from '../entity-editor/EntityTypeHeader';

export default function DatasetHeader(props) {
  const getActionButtions = () => {
    const settings = {
      buttonText: <FormattedMessage id="settings" />,
      onClick: props.onShowDatasetSettings,
      customClass: 'notImplemented',
    };

    const transform = {
      buttonText: <FormattedMessage id="transform" />,
      customClass: props.isLockedFromTransformations
        ? 'disabled'
        : 'clickable',
      onOptionSelected: (item) => {
        props.onClickTransformMenuItem(item);
      },
      subActions: [
        {
          label: <FormattedMessage id="bulk_row_editor" />,
          value: 'bulk-row-editor',
          customClass: 'notImplemented',
        },
        {
          label: <FormattedMessage id="bulk_column_editor" />,
          value: 'bulk-column-editor',
          customClass: 'notImplemented',
        },
        {
          label: <FormattedMessage id="combine_columns" />,
          value: 'combineColumns',
        },
        {
          label: <FormattedMessage id="extract_multiple" />,
          value: 'extractMultiple',
        },
        {
          label: <FormattedMessage id="split_column" />,
          value: 'splitColumn',
        },
        {
          label: <FormattedMessage id="derive_column" />,
          value: 'deriveColumn',
          subMenu: [
            {
              label: <FormattedMessage id="derive_column_category" />,
              value: 'deriveColumnCategory',
            },
            {
              label: <FormattedMessage id="derive_column_javascript" />,
              value: 'deriveColumnJavascript',
            },
          ],
        },
        {
          label: <FormattedMessage id="merge_datasets" />,
          value: 'mergeDatasets',
        },
        {
          label: <FormattedMessage id="generate_geopoints" />,
          value: 'generateGeopoints',
        },
        {
          label: <FormattedMessage id="reverse_geocode" />,
          value: 'reverseGeocode',
        },
      ],
    };

    const transformationLog = {
      icon: <i className="fa fa-list-ol" aria-hidden="true" />,
      onClick: props.onToggleTransformationLog,
    };

    const visualise = {
      buttonText: <FormattedMessage id="visualise" />,
      onClick: props.onNavigateToVisualise,
      props: {
        'data-test-id': 'visualise',
      },
    };

    const result = [settings, transform, transformationLog, visualise];

    return result;
  };

  const {
    onChangeTitle,
    onBeginEditTitle,
    isUnsavedChanges,
    savingFailed,
    timeToNextSave,
    history,
    onSaveDataset,
  } = props;

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
      title={props.name}
      actionButtons={getActionButtions()}
      saveAction={onSaveDataset}
      onChangeTitle={onChangeTitle}
      onBeginEditTitle={onBeginEditTitle}
      saveStatusId={saveStatusId}
      savingFailed={savingFailed}
      timeToNextSave={timeToNextSave}
    />
  );
}

DatasetHeader.propTypes = {
  history: PropTypes.object.isRequired,
  isLockedFromTransformations: PropTypes.bool,
  isUnsavedChanges: PropTypes.bool,
  name: PropTypes.string.isRequired,
  onBeginEditTitle: PropTypes.func,
  onChangeTitle: PropTypes.func,
  onClickTransformMenuItem: PropTypes.func,
  onNavigateToVisualise: PropTypes.func.isRequired,
  onSaveDataset: PropTypes.func.isRequired,
  onShowDatasetSettings: PropTypes.func.isRequired,
  onToggleTransformationLog: PropTypes.func,
  savingFailed: PropTypes.bool,
  timeToNextSave: PropTypes.number,
};

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, injectIntl, intlShape } from 'react-intl';
import ContextMenu from '../common/ContextMenu';

require('./DatasetControls.scss');

class DatasetControls extends Component {
  constructor() {
    super();
    this.state = {
      editorMenuActive: false,
    };
    this.onEditorToggleClick = this.onEditorToggleClick.bind(this);
  }
  onEditorToggleClick() {
    this.setState({
      editorMenuActive: !this.state.editorMenuActive,
    });
  }
  render() {
    const { pendingTransformationsCount, intl } = this.props;
    return (
      <div className="DatasetControls">
        <span className="controlGroup1">
          <span
            className="datasetEditorContainer"
            style={{
              position: 'relative',
            }}
          >
            <button
              className="datasetEditorToggle clickable"
              onClick={() => this.onEditorToggleClick()}
            >
            + <FormattedMessage id="transform" />
            </button>
            {this.state.editorMenuActive &&
              <ContextMenu
                options={[
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
                    label: <FormattedMessage id="derive_column" />,
                    value: 'deriveColumn',
                  },
                  {
                    label: <FormattedMessage id="merge_datasets" />,
                    value: 'merge-datasets',
                    customClass: 'notImplemented',
                  },
                  {
                    label: <FormattedMessage id="generate_geopoints" />,
                    value: 'generateGeopoints',
                  },
                ]}
                onOptionSelected={(item) => {
                  this.onEditorToggleClick();
                  this.props.onClickMenuItem(item);
                }}
                style={{
                  left: 0,
                  width: '16rem',
                }}
                onWindowClick={this.onEditorToggleClick}
              />
            }
          </span>
        </span>
        <span className="controlGroup2">
          <span
            className="columnCount"
          >
            <span>
              {this.props.columns.size} <FormattedMessage id="columns" />
            </span>
          </span>
          {' | '}
          <span
            className="rowCount"
          >
            {this.props.rowsCount} <FormattedMessage id="rows" />
          </span>
          <span
            className="search"
          >
            <input
              type="text"
              placeholder={intl.formatMessage({ id: 'search_not_implemented_yet' })}
            />
          </span>
          <span
            className="transformationLogToggleContainer"
          >
            <button
              className="transformationLogToggle clickable"
              onClick={this.props.onToggleTransformationLog}
            >
              <i className="fa fa-list-ol" aria-hidden="true" /> {pendingTransformationsCount > 0 && `(${pendingTransformationsCount})`}
            </button>
          </span>
        </span>
      </div>
    );
  }
}

DatasetControls.propTypes = {
  intl: intlShape.isRequired,
  onToggleTransformationLog: PropTypes.func.isRequired,
  pendingTransformationsCount: PropTypes.number.isRequired,
  onClickMenuItem: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  rowsCount: PropTypes.number.isRequired,
};

export default injectIntl(DatasetControls);

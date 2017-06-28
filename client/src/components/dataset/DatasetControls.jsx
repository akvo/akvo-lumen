import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ContextMenu from '../common/ContextMenu';

require('./DatasetControls.scss');

export default class DatasetControls extends Component {
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
    const { pendingTransformationsCount } = this.props;
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
            + Transform
            </button>
            {this.state.editorMenuActive &&
              <ContextMenu
                options={[
                  {
                    label: 'Bulk row editor',
                    value: 'bulk-row-editor',
                    customClass: 'notImplemented',
                  },
                  {
                    label: 'Bulk column editor',
                    value: 'bulk-column-editor',
                    customClass: 'notImplemented',
                  },
                  {
                    label: 'Combine Columns',
                    value: 'combineColumns',
                  },
                  {
                    label: 'Derive column',
                    value: 'deriveColumn',
                  },
                  {
                    label: 'Merge datasets',
                    value: 'merge-datasets',
                    customClass: 'notImplemented',
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
              {this.props.columns.size} Columns
            </span>
          </span>
          {' | '}
          <span
            className="rowCount"
          >
            {this.props.rowsCount} Rows
          </span>
          <span
            className="search"
          >
            <input
              type="text"
              placeholder="Search not yet implemented"
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
  onToggleTransformationLog: PropTypes.func.isRequired,
  pendingTransformationsCount: PropTypes.number.isRequired,
  onClickMenuItem: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  rowsCount: PropTypes.number.isRequired,
};

import React, { Component, PropTypes } from 'react';
import ContextMenu from '../common/ContextMenu';

require('../../styles/DatasetControls.scss');

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
            Dataset editor
            </button>
            {this.state.editorMenuActive &&
              <ContextMenu
                options={[
                  {
                    label: 'Bulk row editor',
                    value: 'bulk-row-editor',
                  },
                  {
                    label: 'Bulk column editor',
                    value: 'bulk-column-editor',
                  },
                  {
                    label: 'Combine Columns',
                    value: 'combine-columns',
                  },
                  {
                    label: 'Derive new column',
                    value: 'derive-new-column',
                  },
                  {
                    label: 'Merge datasets',
                    value: 'merge-datasets',
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
              Transformation log
            </button>
          </span>
        </span>
      </div>
    );
  }
}

DatasetControls.propTypes = {
  onToggleTransformationLog: PropTypes.func.isRequired,
  onClickMenuItem: PropTypes.func.isRequired,
  columns: PropTypes.object.isRequired,
  rowsCount: PropTypes.number.isRequired,
};

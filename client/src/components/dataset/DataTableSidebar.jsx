import React, { Component, PropTypes } from 'react';
import DashSelect from '../common/DashSelect';

require('../../styles/DataTableSidebar.scss');

export default class DataTableSidebar extends Component {

  getTitle(sidebarType, columnTitle) {
    switch (sidebarType) {
      case 'edit':
      case 'filter':
        return `${sidebarType.charAt(0).toUpperCase() + sidebarType.slice(1)}
          column ${columnTitle}`;

      case 'transformationLog':
        return 'Transformation Log';

      default:
        throw new Error(`Unknown sidebarType ${sidebarType} supplied to getTitle`);
    }
  }

  getInputs(sidebarType, props) {
    switch (sidebarType) {
      case 'edit':
        return (
          <div className="inputs">
            <div className="inputGroup">
              <label
                htmlFor="dataTypeMenu"
              >
                Change data type to:
              </label>
              <DashSelect
                name="dataTypeMenu"
                value={props.newColumnType}
                options={props.options}
              />
            </div>
            <div className="inputGroup">
              <label
                htmlFor="dateFormatMenu"
              >
                Date format:
              </label>
              <DashSelect
                name="dateFormatMenu"
                value="YYYY-MM-DD"
                options={[
                  {
                    value: 'YYYY-MM-DD',
                    label: 'YYYY-MM-DD',
                  },
                  {
                    value: 'DD-MM-YYYY',
                    label: 'DD-MM-YYYY',
                  },
                  {
                    value: 'MM-DD-YYYY',
                    label: 'MM-DD-YYYY',
                  },
                ]}
              />
            </div>
            <div className="inputGroup">
              <label
                htmlFor="ifInvalidInput"
              >
                If cell format is invalid:
              </label>
              <DashSelect
                name="dataTypeMenu"
                value="deleteRow"
                options={[
                  {
                    value: 'deleteRow',
                    label: 'Delete row',
                  },
                  {
                    value: 'emptyCell',
                    label: 'Empty cell',
                  },
                  {
                    value: 'chooseDefault',
                    label: 'Pick a default value',
                  },
                ]}
              />
            </div>
          </div>
        );

      case 'filter':
        return (
          <div className="inputs">
            <div className="inputGroup">
              <label
                htmlFor="filterTypeMenu"
              >
                Show rows whose
              </label>
              <DashSelect
                name="filterTypeMenu"
                value="value-contains"
                options={[
                  {
                    label: 'Value contains',
                    value: 'value-contains',
                  },
                  {
                    label: 'Value is',
                    value: 'value-is',
                  },
                ]}
              />
            </div>
            <div className="inputGroup">
              <label
                htmlFor="filterTextInput"
              >
                Filter text
              </label>
              <input
                type="text"
                className="filterTextInput"
                ref="filterTextInput"
              />
            </div>
          </div>
        );

      case 'transformationLog':
        return (
          <div
            style={{
              padding: '1rem',
            }}
          >
            Transformation log not yet implemented.
          </div>
        );

      case 'sort':
        return (null);

      default:
        throw new Error(`Unknown sidebar type ${sidebarType} supplied to getInputs`);
    }
  }

  getPositiveButtonText(sidebarType) {
    switch (sidebarType) {
      case 'edit':
      case 'transformationLog':
        return 'Apply';

      case 'filter':
        return 'Filter';

      default:
        throw new Error(`Unknown sidebar type ${sidebarType} supplied to getPositiveButtonText`);
    }
  }

  render() {
    const sidebar = this.props.sidebar;

    return (
      <div
        className="DataTableSidebar"
        style={this.props.style}
      >
        <div className="header">
          <h3>
            {this.getTitle(sidebar.type, sidebar.columnTitle)}
          </h3>
          <button
            className="close clickable"
            onClick={this.props.onClose}
          >
            X
          </button>
        </div>
        {this.getInputs(sidebar.type, this.props)}
        <div className="controls">
          <button
            className="apply clickable"
            onClick={this.props.onClose}
          >
            {this.getPositiveButtonText(sidebar.type)}
          </button>
          <button
            className="cancel clickable"
            onClick={this.props.onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
}

DataTableSidebar.propTypes = {
  style: PropTypes.object,
  columnTitle: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  newColumnType: PropTypes.string,
  options: PropTypes.array,
  sidebar: PropTypes.object.isRequired,
};

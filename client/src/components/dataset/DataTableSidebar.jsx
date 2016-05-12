import React, { PropTypes } from 'react';
import DashSelect from '../common/DashSelect';

require('../../styles/DataTableSidebar.scss');

export default function DataTableSidebar(props) {
  return (
    <div
      className="DataTableSidebar"
      style={props.style}
    >
      <div className="header">
        <h3>
          Edit column <span className="columnTitle">{props.columnTitle}</span>
        </h3>
        <button
          className="close clickable"
          onClick={props.onClose}
        >
          X
        </button>
      </div>
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
      <div className="controls">
        <button
          className="apply clickable"
          onClick={props.onClose}
        >
          Apply
        </button>
        <button
          className="cancel clickable"
          onClick={props.onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

DataTableSidebar.propTypes = {
  style: PropTypes.object,
  columnTitle: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  newColumnType: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
};
